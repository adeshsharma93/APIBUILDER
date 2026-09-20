"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionService = void 0;
const mssql_1 = __importDefault(require("mssql"));
const encryption_1 = require("../utils/encryption");
class ConnectionService {
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
    async createConnection(connection) {
        const pool = await this.getPool();
        const encryptedPassword = (0, encryption_1.encrypt)(connection.password_encrypted);
        const result = await pool.request()
            .input('user_id', mssql_1.default.Int, connection.user_id)
            .input('name', mssql_1.default.NVarChar, connection.name)
            .input('type', mssql_1.default.NVarChar, connection.type)
            .input('host', mssql_1.default.NVarChar, connection.host || null)
            .input('port', mssql_1.default.Int, connection.port || null)
            .input('database_name', mssql_1.default.NVarChar, connection.database_name || null)
            .input('username', mssql_1.default.NVarChar, connection.username || null)
            .input('password_encrypted', mssql_1.default.NVarChar, encryptedPassword)
            .input('is_default', mssql_1.default.Bit, connection.is_default ? 1 : 0)
            .query(`
        INSERT INTO [dbo].[connections] 
        ([user_id], [name], [type], [host], [port], [database_name], [username], [password_encrypted], [is_default])
        OUTPUT INSERTED.*
        VALUES (@user_id, @name, @type, @host, @port, @database_name, @username, @password_encrypted, @is_default)
      `);
        const created = result.recordset[0];
        created.password_encrypted = (0, encryption_1.decrypt)(created.password_encrypted);
        return created;
    }
    async getConnectionById(id, userId) {
        const pool = await this.getPool();
        const result = await pool.request()
            .input('id', mssql_1.default.Int, id)
            .input('user_id', mssql_1.default.Int, userId)
            .query('SELECT * FROM [dbo].[connections] WHERE id = @id AND user_id = @user_id');
        if (result.recordset.length === 0)
            return null;
        const conn = result.recordset[0];
        conn.password_encrypted = (0, encryption_1.decrypt)(conn.password_encrypted);
        return conn;
    }
    async getAllConnections(userId) {
        const pool = await this.getPool();
        const result = await pool.request()
            .input('user_id', mssql_1.default.Int, userId)
            .query('SELECT * FROM [dbo].[connections] WHERE user_id = @user_id ORDER BY created_at DESC');
        return result.recordset.map((conn) => {
            conn.password_encrypted = (0, encryption_1.decrypt)(conn.password_encrypted);
            return conn;
        });
    }
    async updateConnection(id, userId, updates) {
        const pool = await this.getPool();
        let query = 'UPDATE [dbo].[connections] SET ';
        const fields = [];
        if (updates.name !== undefined) {
            fields.push('[name] = @name');
        }
        if (updates.host !== undefined) {
            fields.push('[host] = @host');
        }
        if (updates.port !== undefined) {
            fields.push('[port] = @port');
        }
        if (updates.database_name !== undefined) {
            fields.push('[database_name] = @database_name');
        }
        if (updates.username !== undefined) {
            fields.push('[username] = @username');
        }
        if (updates.password_encrypted !== undefined) {
            fields.push('[password_encrypted] = @password_encrypted');
            updates.password_encrypted = (0, encryption_1.encrypt)(updates.password_encrypted);
        }
        if (updates.is_default !== undefined) {
            fields.push('[is_default] = @is_default');
        }
        fields.push('[updated_at] = GETDATE()');
        query += fields.join(', ');
        query += ' OUTPUT INSERTED.* WHERE id = @id AND user_id = @user_id';
        const request = pool.request()
            .input('id', mssql_1.default.Int, id)
            .input('user_id', mssql_1.default.Int, userId);
        if (updates.name !== undefined)
            request.input('name', mssql_1.default.NVarChar, updates.name);
        if (updates.host !== undefined)
            request.input('host', mssql_1.default.NVarChar, updates.host);
        if (updates.port !== undefined)
            request.input('port', mssql_1.default.Int, updates.port);
        if (updates.database_name !== undefined)
            request.input('database_name', mssql_1.default.NVarChar, updates.database_name);
        if (updates.username !== undefined)
            request.input('username', mssql_1.default.NVarChar, updates.username);
        if (updates.password_encrypted !== undefined)
            request.input('password_encrypted', mssql_1.default.NVarChar, updates.password_encrypted);
        if (updates.is_default !== undefined)
            request.input('is_default', mssql_1.default.Bit, updates.is_default ? 1 : 0);
        const result = await request.query(query);
        if (result.recordset.length === 0)
            return null;
        const conn = result.recordset[0];
        conn.password_encrypted = (0, encryption_1.decrypt)(conn.password_encrypted);
        return conn;
    }
    async deleteConnection(id, userId) {
        const pool = await this.getPool();
        const result = await pool.request()
            .input('id', mssql_1.default.Int, id)
            .input('user_id', mssql_1.default.Int, userId)
            .query('DELETE FROM [dbo].[connections] WHERE id = @id AND user_id = @user_id');
        return result.rowsAffected[0] > 0;
    }
}
exports.ConnectionService = ConnectionService;
exports.default = new ConnectionService();
//# sourceMappingURL=connectionService.js.map