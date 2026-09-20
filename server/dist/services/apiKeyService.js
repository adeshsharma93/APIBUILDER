"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyService = void 0;
const database_1 = require("../config/database");
const encryption_1 = require("../utils/encryption");
const uuid_1 = require("uuid");
class ApiKeyService {
    async createApiKey(input) {
        const pool = await (0, database_1.getAppDbPool)();
        const id = (0, uuid_1.v4)();
        const rawKey = (0, encryption_1.generateApiKey)();
        const key_hash = await (0, encryption_1.hashApiKey)(rawKey);
        const key_prefix = rawKey.substring(0, 14);
        await pool.query(`INSERT INTO api_keys (id, project_id, name, key_hash, key_prefix, allowed_apis, expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            id,
            input.project_id,
            input.name,
            key_hash,
            key_prefix,
            JSON.stringify(input.allowed_apis || []),
            input.expires_at || null,
            input.created_by,
        ]);
        const apiKey = {
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
    async getApiKeyById(id, projectId) {
        const pool = await (0, database_1.getAppDbPool)();
        const [rows] = await pool.query('SELECT * FROM api_keys WHERE id = ? AND project_id = ?', [id, projectId]);
        const recordset = rows;
        if (recordset.length === 0)
            return null;
        const key = recordset[0];
        key.allowed_apis = typeof key.allowed_apis === 'string' ? JSON.parse(key.allowed_apis) : key.allowed_apis;
        return key;
    }
    async getApiKeysByProject(projectId) {
        const pool = await (0, database_1.getAppDbPool)();
        const [rows] = await pool.query('SELECT * FROM api_keys WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
        const recordset = rows;
        return recordset.map((key) => {
            key.allowed_apis = typeof key.allowed_apis === 'string' ? JSON.parse(key.allowed_apis) : key.allowed_apis;
            return key;
        });
    }
    async validateApiKey(rawKey) {
        const pool = await (0, database_1.getAppDbPool)();
        const keyHash = await (0, encryption_1.hashApiKey)(rawKey);
        const [rows] = await pool.query('SELECT * FROM api_keys WHERE key_hash = ? AND is_active = TRUE', [keyHash]);
        const recordset = rows;
        if (recordset.length === 0)
            return null;
        const key = recordset[0];
        if (key.expires_at && new Date(key.expires_at) < new Date()) {
            return null;
        }
        key.allowed_apis = typeof key.allowed_apis === 'string' ? JSON.parse(key.allowed_apis) : key.allowed_apis;
        return key;
    }
    async updateApiKeyLastUsed(id) {
        const pool = await (0, database_1.getAppDbPool)();
        await pool.query(`UPDATE api_keys 
       SET last_used_at = NOW(), request_count = request_count + 1 
       WHERE id = ?`, [id]);
    }
    async deleteApiKey(id, projectId) {
        const pool = await (0, database_1.getAppDbPool)();
        const [result] = await pool.query('DELETE FROM api_keys WHERE id = ? AND project_id = ?', [id, projectId]);
        return result.affectedRows > 0;
    }
    async deactivateApiKey(id, projectId) {
        const pool = await (0, database_1.getAppDbPool)();
        const [result] = await pool.query('UPDATE api_keys SET is_active = FALSE WHERE id = ? AND project_id = ?', [id, projectId]);
        return result.affectedRows > 0;
    }
    async verifyApiKey(rawKey) {
        const apiKey = await this.validateApiKey(rawKey);
        if (!apiKey) {
            return { valid: false };
        }
        return { valid: true, apiKey };
    }
    async hasAccessToApi(apiKeyId, apiId) {
        const pool = await (0, database_1.getAppDbPool)();
        const [rows] = await pool.query('SELECT allowed_apis FROM api_keys WHERE id = ?', [apiKeyId]);
        const recordset = rows;
        if (recordset.length === 0)
            return false;
        const allowedApis = typeof recordset[0].allowed_apis === 'string'
            ? JSON.parse(recordset[0].allowed_apis)
            : recordset[0].allowed_apis;
        return allowedApis.includes(apiId) || allowedApis.includes('*');
    }
}
exports.ApiKeyService = ApiKeyService;
exports.default = new ApiKeyService();
//# sourceMappingURL=apiKeyService.js.map