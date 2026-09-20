"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = void 0;
const mssql_1 = __importDefault(require("mssql"));
class ApiService {
    constructor() {
        this.pool = null;
    }
    async getPool() {
        if (!this.pool) {
            const config = {
                server: process.env.APP_DB_SERVER || 'localhost',
                database: process.env.APP_DB_NAME || 'sqlapibuilder',
                user: process.env.APP_DB_USER || 'sa',
                password: process.env.APP_DB_PASSWORD || '',
                options: {
                    encrypt: process.env.APP_DB_ENCRYPT === 'true',
                    trustServerCertificate: true
                }
            };
            this.pool = await mssql_1.default.connect(config);
        }
        return this.pool;
    }
    async createApi(api) {
        const pool = await this.getPool();
        const parametersJson = api.parameters ? JSON.stringify(api.parameters) : null;
        const result = await pool.request()
            .input('user_id', mssql_1.default.Int, api.user_id)
            .input('connection_id', mssql_1.default.Int, api.connection_id)
            .input('name', mssql_1.default.NVarChar, api.name)
            .input('description', mssql_1.default.NVarChar, api.description || null)
            .input('query', mssql_1.default.NVarChar, api.query)
            .input('method', mssql_1.default.NVarChar, api.method)
            .input('endpoint', mssql_1.default.NVarChar, api.endpoint)
            .input('parameters', mssql_1.default.NVarChar, parametersJson)
            .input('is_published', mssql_1.default.Bit, api.is_published ? 1 : 0)
            .input('requires_auth', mssql_1.default.Bit, api.requires_auth !== false ? 1 : 0)
            .input('rate_limit', mssql_1.default.Int, api.rate_limit || 100)
            .query(`
        INSERT INTO [dbo].[apis] 
        ([user_id], [connection_id], [name], [description], [query], [method], [endpoint], [parameters], [is_published], [requires_auth], [rate_limit])
        OUTPUT INSERTED.*
        VALUES (@user_id, @connection_id, @name, @description, @query, @method, @endpoint, @parameters, @is_published, @requires_auth, @rate_limit)
      `);
        const created = result.recordset[0];
        if (created.parameters) {
            created.parameters = JSON.parse(created.parameters);
        }
        return created;
    }
    async getApiById(id, userId) {
        const pool = await this.getPool();
        const result = await pool.request()
            .input('id', mssql_1.default.Int, id)
            .input('user_id', mssql_1.default.Int, userId)
            .query('SELECT * FROM [dbo].[apis] WHERE id = @id AND user_id = @user_id');
        if (result.recordset.length === 0)
            return null;
        const api = result.recordset[0];
        if (api.parameters) {
            api.parameters = JSON.parse(api.parameters);
        }
        return api;
    }
    async getAllApis(userId) {
        const pool = await this.getPool();
        const result = await pool.request()
            .input('user_id', mssql_1.default.Int, userId)
            .query('SELECT * FROM [dbo].[apis] WHERE user_id = @user_id ORDER BY created_at DESC');
        return result.recordset.map((api) => {
            if (api.parameters) {
                api.parameters = JSON.parse(api.parameters);
            }
            return api;
        });
    }
    async updateApi(id, userId, updates) {
        const pool = await this.getPool();
        let query = 'UPDATE [dbo].[apis] SET ';
        const fields = [];
        if (updates.name !== undefined) {
            fields.push('[name] = @name');
        }
        if (updates.description !== undefined) {
            fields.push('[description] = @description');
        }
        if (updates.query !== undefined) {
            fields.push('[query] = @query');
        }
        if (updates.method !== undefined) {
            fields.push('[method] = @method');
        }
        if (updates.endpoint !== undefined) {
            fields.push('[endpoint] = @endpoint');
        }
        if (updates.parameters !== undefined) {
            fields.push('[parameters] = @parameters');
        }
        if (updates.is_published !== undefined) {
            fields.push('[is_published] = @is_published');
        }
        if (updates.requires_auth !== undefined) {
            fields.push('[requires_auth] = @requires_auth');
        }
        if (updates.rate_limit !== undefined) {
            fields.push('[rate_limit] = @rate_limit');
        }
        fields.push('[updated_at] = GETDATE()');
        query += fields.join(', ');
        query += ' OUTPUT INSERTED.* WHERE id = @id AND user_id = @user_id';
        const request = pool.request()
            .input('id', mssql_1.default.Int, id)
            .input('user_id', mssql_1.default.Int, userId);
        if (updates.name !== undefined)
            request.input('name', mssql_1.default.NVarChar, updates.name);
        if (updates.description !== undefined)
            request.input('description', mssql_1.default.NVarChar, updates.description);
        if (updates.query !== undefined)
            request.input('query', mssql_1.default.NVarChar, updates.query);
        if (updates.method !== undefined)
            request.input('method', mssql_1.default.NVarChar, updates.method);
        if (updates.endpoint !== undefined)
            request.input('endpoint', mssql_1.default.NVarChar, updates.endpoint);
        if (updates.parameters !== undefined)
            request.input('parameters', mssql_1.default.NVarChar, JSON.stringify(updates.parameters));
        if (updates.is_published !== undefined)
            request.input('is_published', mssql_1.default.Bit, updates.is_published ? 1 : 0);
        if (updates.requires_auth !== undefined)
            request.input('requires_auth', mssql_1.default.Bit, updates.requires_auth ? 1 : 0);
        if (updates.rate_limit !== undefined)
            request.input('rate_limit', mssql_1.default.Int, updates.rate_limit);
        const result = await request.query(query);
        if (result.recordset.length === 0)
            return null;
        const api = result.recordset[0];
        if (api.parameters) {
            api.parameters = JSON.parse(api.parameters);
        }
        return api;
    }
    async deleteApi(id, userId) {
        const pool = await this.getPool();
        const result = await pool.request()
            .input('id', mssql_1.default.Int, id)
            .input('user_id', mssql_1.default.Int, userId)
            .query('DELETE FROM [dbo].[apis] WHERE id = @id AND user_id = @user_id');
        return result.rowsAffected[0] > 0;
    }
    async getApiByEndpoint(endpoint) {
        const pool = await this.getPool();
        const result = await pool.request()
            .input('endpoint', mssql_1.default.NVarChar, endpoint)
            .query('SELECT * FROM [dbo].[apis] WHERE endpoint = @endpoint AND is_published = 1');
        if (result.recordset.length === 0)
            return null;
        const api = result.recordset[0];
        if (api.parameters) {
            api.parameters = JSON.parse(api.parameters);
        }
        return api;
    }
}
exports.ApiService = ApiService;
exports.default = new ApiService();
//# sourceMappingURL=apiService.js.map