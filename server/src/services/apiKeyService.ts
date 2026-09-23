import mysql from 'mysql2/promise';
import { getAppDbPool } from '../config/database';
import { generateApiKey, hashApiKey, verifyApiKey } from '../utils/encryption';
import { v4 as uuidv4 } from 'uuid';

export interface ApiKey {
  id: string;
  project_id: string;
  name: string;
  key_prefix: string;
  allowed_apis: string[];
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
  request_count: number;
  created_at: string;
}

export interface CreateApiKeyInput {
  project_id: string;
  name: string;
  allowed_apis?: string[];
  expires_at?: string;
  created_by: string;
}

export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  rawKey: string;
}

export class ApiKeyService {
  async createApiKey(input: CreateApiKeyInput): Promise<CreateApiKeyResponse> {
    const pool = await getAppDbPool();
    const id = uuidv4();
    const rawKey = generateApiKey();
    const key_hash = await hashApiKey(rawKey);
    const key_prefix = rawKey.substring(0, 14);

    await pool.query(
      `INSERT INTO api_keys (id, project_id, name, key_hash, key_prefix, allowed_apis, expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.project_id,
        input.name,
        key_hash,
        key_prefix,
        JSON.stringify(input.allowed_apis || []),
        input.expires_at || null,
        input.created_by,
      ]
    );

    const apiKey: ApiKey = {
      id,
      project_id: input.project_id,
      name: input.name,
      key_prefix,
      allowed_apis: input.allowed_apis || [],
      expires_at: input.expires_at || null,
      last_used_at: null,
      is_active: true,
      request_count: 0,
      created_at: new Date().toISOString(),
    };

    return { apiKey, rawKey };
  }

  async getApiKeyById(id: string, projectId: string): Promise<ApiKey | null> {
    const pool = await getAppDbPool();
    const [rows] = await pool.query(
      'SELECT * FROM api_keys WHERE id = ? AND project_id = ?',
      [id, projectId]
    );

    const recordset = rows as any[];
    if (recordset.length === 0) return null;

    const key = recordset[0];
    key.allowed_apis = typeof key.allowed_apis === 'string' ? JSON.parse(key.allowed_apis) : key.allowed_apis;
    return key;
  }

  async getApiKeysByProject(projectId: string): Promise<ApiKey[]> {
    const pool = await getAppDbPool();
    const [rows] = await pool.query(
      'SELECT * FROM api_keys WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );

    const recordset = rows as any[];
    return recordset.map((key: any) => {
      key.allowed_apis = typeof key.allowed_apis === 'string' ? JSON.parse(key.allowed_apis) : key.allowed_apis;
      return key;
    });
  }

  async validateApiKey(rawKey: string): Promise<ApiKey | null> {
    const pool = await getAppDbPool();
    const keyHash = await hashApiKey(rawKey);
    
    const [rows] = await pool.query(
      'SELECT * FROM api_keys WHERE key_hash = ? AND is_active = TRUE',
      [keyHash]
    );

    const recordset = rows as any[];
    if (recordset.length === 0) return null;

    const key = recordset[0];
    
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return null;
    }

    key.allowed_apis = typeof key.allowed_apis === 'string' ? JSON.parse(key.allowed_apis) : key.allowed_apis;
    return key;
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    const pool = await getAppDbPool();
    await pool.query(
      `UPDATE api_keys 
       SET last_used_at = NOW(), request_count = request_count + 1 
       WHERE id = ?`,
      [id]
    );
  }

  async deleteApiKey(id: string, projectId: string): Promise<boolean> {
    const pool = await getAppDbPool();
    const [result] = await pool.query(
      'DELETE FROM api_keys WHERE id = ? AND project_id = ?',
      [id, projectId]
    );

    return (result as any).affectedRows > 0;
  }

  async deactivateApiKey(id: string, projectId: string): Promise<boolean> {
    const pool = await getAppDbPool();
    const [result] = await pool.query(
      'UPDATE api_keys SET is_active = FALSE WHERE id = ? AND project_id = ?',
      [id, projectId]
    );

    return (result as any).affectedRows > 0;
  }

  async verifyApiKey(rawKey: string): Promise<{ valid: boolean; apiKey?: ApiKey }> {
    const apiKey = await this.validateApiKey(rawKey);
    if (!apiKey) {
      return { valid: false };
    }
    return { valid: true, apiKey };
  }

  async hasAccessToApi(apiKeyId: string, apiId: string): Promise<boolean> {
    const pool = await getAppDbPool();
    const [rows] = await pool.query(
      'SELECT allowed_apis FROM api_keys WHERE id = ?',
      [apiKeyId]
    );

    const recordset = rows as any[];
    if (recordset.length === 0) return false;

    const allowedApis = typeof recordset[0].allowed_apis === 'string' 
      ? JSON.parse(recordset[0].allowed_apis) 
      : recordset[0].allowed_apis;
    
    return allowedApis.includes(apiId) || allowedApis.includes('*');
  }
}

export default new ApiKeyService();
