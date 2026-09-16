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
  rawKey: string; // Only returned once at creation
}

export class ApiKeyService {
  /**
   * Create a new API key
   */
  async createApiKey(input: CreateApiKeyInput): Promise<CreateApiKeyResponse> {
    const pool = await getAppDbPool();
    const id = uuidv4();

    // Generate the raw API key
    const rawKey = generateApiKey();

    // Hash the key for storage
    const key_hash = await hashApiKey(rawKey);

    // Get prefix for identification (first 10 chars)
    const key_prefix = rawKey.substring(0, 14);

    const result = await pool.request()
      .input('id', id)
      .input('project_id', input.project_id)
      .input('name', input.name)
      .input('key_hash', key_hash)
      .input('key_prefix', key_prefix)
      .input('allowed_apis', input.allowed_apis || [])
      .input('expires_at', input.expires_at || null)
      .input('created_by', input.created_by)
      .query(`
        INSERT INTO api_keys (
          id, project_id, name, key_hash, key_prefix, allowed_apis, expires_at, created_by
        ) OUTPUT INSERTED.*
        VALUES (
          @id, @project_id, @name, @key_hash, @key_prefix, @allowed_apis, @expires_at, @created_by
        )
      `);

    return {
      apiKey: this.formatApiKey(result.recordset[0]),
      rawKey, // Return the raw key only once
    };
  }

  /**
   * Get all API keys for a project
   */
  async getApiKeys(projectId: string): Promise<ApiKey[]> {
    const pool = await getAppDbPool();
    const result = await pool.request()
      .input('project_id', projectId)
      .query('SELECT * FROM api_keys WHERE project_id = @project_id ORDER BY created_at DESC');

    return result.recordset.map(this.formatApiKey);
  }

  /**
   * Get a single API key by ID
   */
  async getApiKey(id: string): Promise<ApiKey | null> {
    const pool = await getAppDbPool();
    const result = await pool.request()
      .input('id', id)
      .query('SELECT * FROM api_keys WHERE id = @id');

    if (result.recordset.length === 0) {
      return null;
    }

    return this.formatApiKey(result.recordset[0]);
  }

  /**
   * Verify an API key and return the key record if valid
   */
  async verifyApiKey(rawKey: string): Promise<{ valid: boolean; apiKey?: ApiKey; error?: string }> {
    const pool = await getAppDbPool();

    // Get the key prefix to find potential matches
    const prefix = rawKey.substring(0, 14);

    const result = await pool.request()
      .input('key_prefix', prefix)
      .query('SELECT * FROM api_keys WHERE key_prefix = @key_prefix AND is_active = true');

    if (result.recordset.length === 0) {
      return { valid: false, error: 'Invalid API key' };
    }

    // Check each matching key
    for (const row of result.recordset) {
      const isValid = await verifyApiKey(rawKey, row.key_hash);

      if (isValid) {
        const apiKey = this.formatApiKey(row);

        // Check expiration
        if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
          return { valid: false, error: 'API key has expired' };
        }

        // Update last used
        await pool.request()
          .input('id', apiKey.id)
          .query(`
            UPDATE api_keys 
            SET last_used_at = CURRENT_TIMESTAMP,
                request_count = request_count + 1
            WHERE id = @id
          `);

        return { valid: true, apiKey };
      }
    }

    return { valid: false, error: 'Invalid API key' };
  }

  /**
   * Check if an API key has access to a specific API
   */
  async hasAccessToApi(apiKeyId: string, apiId: string): Promise<boolean> {
    const apiKey = await this.getApiKey(apiKeyId);
    if (!apiKey) {
      return false;
    }

    // Empty allowed_apis means access to all APIs
    if (apiKey.allowed_apis.length === 0) {
      return true;
    }

    return apiKey.allowed_apis.includes(apiId);
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(id: string): Promise<void> {
    const pool = await getAppDbPool();
    await pool.request()
      .input('id', id)
      .query('UPDATE api_keys SET is_active = false WHERE id = @id');
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(id: string): Promise<void> {
    const pool = await getAppDbPool();
    await pool.request()
      .input('id', id)
      .query('DELETE FROM api_keys WHERE id = @id');
  }

  /**
   * Format database row to API response (never expose hash)
   */
  private formatApiKey(row: any): ApiKey {
    return {
      id: row.id,
      project_id: row.project_id,
      name: row.name,
      key_prefix: row.key_prefix,
      allowed_apis: row.allowed_apis || [],
      expires_at: row.expires_at,
      last_used_at: row.last_used_at,
      is_active: row.is_active,
      request_count: row.request_count,
      created_at: row.created_at,
    };
  }
}

export const apiKeyService = new ApiKeyService();
