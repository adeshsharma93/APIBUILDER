"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConnectionService = exports.DatabaseConnectionService = void 0;
const mssql_1 = __importDefault(require("mssql"));
const mysqlDatabase_1 = require("../config/mysqlDatabase");
const database_1 = require("../config/database");
const encryption_1 = require("../utils/encryption");
const uuid_1 = require("uuid");
/**
 * Convert ISO datetime to MySQL datetime format
 * MySQL expects: 'YYYY-MM-DD HH:MM:SS'
 * ISO format: 'YYYY-MM-DDTHH:MM:SS.sssZ'
 */
function toMysqlDateTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().slice(0, 19).replace('T', ' ');
}
class DatabaseConnectionService {
    /**
     * Create a new database connection
     */
    async createConnection(input) {
        const id = (0, uuid_1.v4)();
        const encrypted_password = await (0, encryption_1.encryptCredential)(input.password);
        const now = new Date();
        const mysqlNow = toMysqlDateTime(now);
        if (input.type === 'mysql') {
            const pool = await (0, mysqlDatabase_1.getMysqlPool)();
            await pool.execute(`INSERT INTO database_connections 
         (id, project_id, name, type, host, port, database_name, username, encrypted_password, ssl_enabled, connection_timeout, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, input.project_id, input.name, input.type, input.host, input.port, input.database_name, input.username, encrypted_password, input.ssl_enabled, input.connection_timeout, mysqlNow, mysqlNow]);
        }
        else {
            // SQL Server
            const pool = await (0, database_1.getAppDbPool)();
            await pool.request()
                .input('id', mssql_1.default.NVarChar, id)
                .input('project_id', mssql_1.default.NVarChar, input.project_id)
                .input('name', mssql_1.default.NVarChar, input.name)
                .input('type', mssql_1.default.NVarChar, input.type)
                .input('host', mssql_1.default.NVarChar, input.host)
                .input('port', mssql_1.default.Int, input.port)
                .input('database_name', mssql_1.default.NVarChar, input.database_name)
                .input('username', mssql_1.default.NVarChar, input.username)
                .input('encrypted_password', mssql_1.default.NVarChar, encrypted_password)
                .input('ssl_enabled', mssql_1.default.Bit, input.ssl_enabled)
                .input('connection_timeout', mssql_1.default.Int, input.connection_timeout)
                .query(`
          INSERT INTO database_connections 
          (id, project_id, name, type, host, port, database_name, username, encrypted_password, ssl_enabled, connection_timeout)
          VALUES (@id, @project_id, @name, @type, @host, @port, @database_name, @username, @encrypted_password, @ssl_enabled, @connection_timeout)
        `);
        }
        return {
            id,
            project_id: input.project_id,
            name: input.name,
            type: input.type,
            host: input.host,
            port: input.port,
            database_name: input.database_name,
            username: input.username,
            ssl_enabled: input.ssl_enabled,
            connection_timeout: input.connection_timeout,
            status: 'disconnected',
            last_tested_at: null,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
        };
    }
    /**
     * Get all connections for a project
     */
    async getConnections(projectId, type = 'mysql') {
        if (type === 'mysql') {
            const pool = await (0, mysqlDatabase_1.getMysqlPool)();
            const [rows] = await pool.execute('SELECT * FROM database_connections WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
            return rows;
        }
        else {
            const pool = await (0, database_1.getAppDbPool)();
            const result = await pool.request()
                .input('project_id', mssql_1.default.NVarChar, projectId)
                .query('SELECT * FROM database_connections WHERE project_id = @project_id ORDER BY created_at DESC');
            return result.recordset;
        }
    }
    /**
     * Get a single connection by ID
     */
    async getConnection(id, type = 'mysql') {
        if (type === 'mysql') {
            const pool = await (0, mysqlDatabase_1.getMysqlPool)();
            const [rows] = await pool.execute('SELECT * FROM database_connections WHERE id = ?', [id]);
            const result = rows;
            return result.length > 0 ? result[0] : null;
        }
        else {
            const pool = await (0, database_1.getAppDbPool)();
            const result = await pool.request()
                .input('id', mssql_1.default.NVarChar, id)
                .query('SELECT * FROM database_connections WHERE id = @id');
            return result.recordset.length > 0 ? result.recordset[0] : null;
        }
    }
    /**
     * Test a database connection
     */
    async testConnection(id, type = 'mysql') {
        const connection = await this.getConnection(id, type);
        if (!connection) {
            return { success: false, error: 'Connection not found' };
        }
        // Decrypt password
        const password = await (0, encryption_1.decryptCredential)(connection.encrypted_password);
        // Test the connection
        let success;
        if (type === 'mysql') {
            success = await (0, mysqlDatabase_1.testMysqlConnection)({
                host: connection.host,
                port: connection.port,
                database: connection.database_name,
                username: connection.username,
                password,
                ssl: connection.ssl_enabled,
            });
        }
        else {
            success = await (0, database_1.testConnection)({
                host: connection.host,
                port: connection.port,
                database: connection.database_name,
                username: connection.username,
                password,
                ssl: connection.ssl_enabled,
            });
        }
        // Update status
        const now = new Date();
        const mysqlNow = toMysqlDateTime(now);
        const status = success ? 'connected' : 'error';
        if (type === 'mysql') {
            const pool = await (0, mysqlDatabase_1.getMysqlPool)();
            await pool.execute('UPDATE database_connections SET status = ?, last_tested_at = ?, updated_at = ? WHERE id = ?', [status, mysqlNow, mysqlNow, id]);
        }
        else {
            const pool = await (0, database_1.getAppDbPool)();
            await pool.request()
                .input('id', mssql_1.default.NVarChar, id)
                .input('status', mssql_1.default.NVarChar, status)
                .input('last_tested_at', mssql_1.default.DateTime, now)
                .query('UPDATE database_connections SET status = @status, last_tested_at = @last_tested_at, updated_at = CURRENT_TIMESTAMP WHERE id = @id');
        }
        if (!success) {
            return { success: false, error: 'Connection test failed' };
        }
        return { success: true };
    }
    /**
     * Delete a connection
     */
    async deleteConnection(id, type = 'mysql') {
        if (type === 'mysql') {
            const pool = await (0, mysqlDatabase_1.getMysqlPool)();
            await pool.execute('DELETE FROM database_connections WHERE id = ?', [id]);
        }
        else {
            const pool = await (0, database_1.getAppDbPool)();
            await pool.request()
                .input('id', mssql_1.default.NVarChar, id)
                .query('DELETE FROM database_connections WHERE id = @id');
        }
    }
    /**
     * Get user database pool (for executing queries)
     */
    async getUserDbPool(connectionId, type = 'mysql') {
        if (type === 'mysql') {
            return (0, mysqlDatabase_1.getUserMysqlPool)(connectionId);
        }
        else {
            return (0, database_1.getUserDbPool)(connectionId);
        }
    }
}
exports.DatabaseConnectionService = DatabaseConnectionService;
exports.databaseConnectionService = new DatabaseConnectionService();
//# sourceMappingURL=databaseConnectionService.js.map