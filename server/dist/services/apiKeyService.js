"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyService = exports.ApiKeyService = void 0;
const mssql_1 = __importDefault(require("mssql"));
const database_1 = require("../config/database");
const encryption_1 = require("../utils/encryption");
const uuid_1 = require("uuid");
class ApiKeyService {
    /**
     * Create a new API key
     */
    async createApiKey(input) {
        const pool = await (0, database_1.getAppDbPool)();
        const id = (0, uuid_1.v4)();
        // Generate the raw API key
        const rawKey = (0, encryption_1.generateApiKey)();
        // Hash the key for storage
        const key_hash = await (0, encryption_1.hashApiKey)(rawKey);
        // Get prefix for identification (first 10 chars)
        const key_prefix = rawKey.substring(0, 14);
        const result = await pool.request()
            .input('id', mssql_1.default.NVarChar, id)
            .input('project_id', mssql_1.default.NVarChar, input.project_id)
            .input('name', mssql_1.default.NVarChar, input.name)
            .input('key_hash', mssql_1.default.NVarChar, key_hash)
            .input('key_prefix', mssql_1.default.NVarChar, key_prefix)
            .input('allowed_apis', mssql_1.default.NVarChar, input.allowed_apis || [])
            .input('expires_at', mssql_1.default.NVarChar, input.expires_at || null)
            .input('created_by', mssql_1.default.NVarChar, input.created_by)
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
    async getApiKeys(projectId) {
        const pool = await (0, database_1.getAppDbPool)();
        const result = await pool.request()
            .input('project_id', mssql_1.default.NVarChar, projectId)
            .query('SELECT * FROM api_keys WHERE project_id = @project_id ORDER BY created_at DESC');
        return result.recordset.map(this.formatApiKey);
    }
    /**
     * Get a single API key by ID
     */
    async getApiKey(id) {
        const pool = await (0, database_1.getAppDbPool)();
        const result = await pool.request()
            .input('id', mssql_1.default.NVarChar, id)
            .query('SELECT * FROM api_keys WHERE id = @id');
        if (result.recordset.length === 0) {
            return null;
        }
        return this.formatApiKey(result.recordset[0]);
    }
    /**
     * Verify an API key and return the key record if valid
     */
    async verifyApiKey(rawKey) {
        const pool = await (0, database_1.getAppDbPool)();
        // Get the key prefix to find potential matches
        const prefix = rawKey.substring(0, 14);
        const result = await pool.request()
            .input('key_prefix', mssql_1.default.NVarChar, prefix)
            .query('SELECT * FROM api_keys WHERE key_prefix = @key_prefix AND is_active = true');
        if (result.recordset.length === 0) {
            return { valid: false, error: 'Invalid API key' };
        }
        // Check each matching key
        for (const row of result.recordset) {
            const isValid = await (0, encryption_1.verifyApiKey)(rawKey, row.key_hash);
            if (isValid) {
                const apiKey = this.formatApiKey(row);
                // Check expiration
                if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
                    return { valid: false, error: 'API key has expired' };
                }
                // Update last used
                await pool.request()
                    .input('id', mssql_1.default.NVarChar, apiKey.id)
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
    async hasAccessToApi(apiKeyId, apiId) {
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
    async revokeApiKey(id) {
        const pool = await (0, database_1.getAppDbPool)();
        await pool.request()
            .input('id', mssql_1.default.NVarChar, id)
            .query('UPDATE api_keys SET is_active = false WHERE id = @id');
    }
    /**
     * Delete an API key
     */
    async deleteApiKey(id) {
        const pool = await (0, database_1.getAppDbPool)();
        await pool.request()
            .input('id', mssql_1.default.NVarChar, id)
            .query('DELETE FROM api_keys WHERE id = @id');
    }
    /**
     * Format database row to API response (never expose hash)
     */
    formatApiKey(row) {
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
exports.ApiKeyService = ApiKeyService;
exports.apiKeyService = new ApiKeyService();
//# sourceMappingURL=apiKeyService.js.map