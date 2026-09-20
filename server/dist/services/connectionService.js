"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionService = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const encryption_1 = require("../utils/encryption");
class ConnectionService {
    constructor() {
        this.pool = null;
    }
    async getPool() {
        if (!this.pool) {
            this.pool = promise_1.default.createPool({
                host: process.env.MYSQL_DB_HOST || 'localhost',
                port: parseInt(process.env.MYSQL_DB_PORT || '3306'),
                database: process.env.MYSQL_DB_NAME || 'sql_api_builder',
                user: process.env.MYSQL_DB_USER || 'root',
                password: process.env.MYSQL_DB_PASSWORD || '',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
            });
        }
        return this.pool;
    }
    async createConnection(connection) {
        const pool = await this.getPool();
        const encryptedPassword = (0, encryption_1.encrypt)(connection.password_encrypted);
        // Generate UUID for id
        const [uuidResult] = await pool.query("SELECT UUID() as id");
        const id = uuidResult[0].id;
        const [result] = await pool.query(`INSERT INTO database_connections 
       (id, project_id, name, type, host, port, database_name, username, encrypted_password, ssl_enabled, connection_timeout, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            id,
            connection.project_id,
            connection.name,
            connection.type,
            connection.host,
            connection.port,
            connection.database_name,
            connection.username,
            encryptedPassword,
            connection.ssl_enabled ? 1 : 0,
            connection.connection_timeout || 30,
            'disconnected',
        ]);
        const created = await this.getConnectionById(id, connection.project_id);
        return created;
    }
    async getConnectionById(id, projectId) {
        const pool = await this.getPool();
        const [rows] = await pool.query('SELECT * FROM database_connections WHERE id = ? AND project_id = ?', [id, projectId]);
        const recordset = rows;
        if (recordset.length === 0)
            return null;
        const conn = recordset[0];
        // Don't decrypt here, only decrypt when needed for actual connection
        return conn;
    }
    async getAllConnections(projectId) {
        const pool = await this.getPool();
        const [rows] = await pool.query('SELECT * FROM database_connections WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
        return rows;
    }
    async updateConnection(id, projectId, updates) {
        const pool = await this.getPool();
        const fields = [];
        const values = [];
        if (updates.name !== undefined) {
            fields.push('name = ?');
            values.push(updates.name);
        }
        if (updates.host !== undefined) {
            fields.push('host = ?');
            values.push(updates.host);
        }
        if (updates.port !== undefined) {
            fields.push('port = ?');
            values.push(updates.port);
        }
        if (updates.database_name !== undefined) {
            fields.push('database_name = ?');
            values.push(updates.database_name);
        }
        if (updates.username !== undefined) {
            fields.push('username = ?');
            values.push(updates.username);
        }
        if (updates.password_encrypted !== undefined) {
            fields.push('encrypted_password = ?');
            values.push((0, encryption_1.encrypt)(updates.password_encrypted));
        }
        if (updates.ssl_enabled !== undefined) {
            fields.push('ssl_enabled = ?');
            values.push(updates.ssl_enabled ? 1 : 0);
        }
        if (updates.connection_timeout !== undefined) {
            fields.push('connection_timeout = ?');
            values.push(updates.connection_timeout);
        }
        if (updates.status !== undefined) {
            fields.push('status = ?');
            values.push(updates.status);
        }
        if (updates.last_tested_at !== undefined) {
            fields.push('last_tested_at = ?');
            values.push(updates.last_tested_at);
        }
        fields.push('updated_at = NOW()');
        values.push(id, projectId);
        const query = `UPDATE database_connections SET ${fields.join(', ')} WHERE id = ? AND project_id = ?`;
        await pool.query(query, values);
        const updated = await this.getConnectionById(id, projectId);
        return updated;
    }
    async deleteConnection(id, projectId) {
        const pool = await this.getPool();
        const [result] = await pool.query('DELETE FROM database_connections WHERE id = ? AND project_id = ?', [id, projectId]);
        return result.affectedRows > 0;
    }
}
exports.ConnectionService = ConnectionService;
exports.default = new ConnectionService();
//# sourceMappingURL=connectionService.js.map