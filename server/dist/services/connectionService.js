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
                database: process.env.MYSQL_DB_NAME || 'SQLAPIBuilder',
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
        const [result] = await pool.query(`INSERT INTO connections 
       (user_id, name, type, host, port, database_name, username, password_encrypted, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            connection.user_id,
            connection.name,
            connection.type,
            connection.host || null,
            connection.port || null,
            connection.database_name || null,
            connection.username || null,
            encryptedPassword,
            connection.is_default ? 1 : 0,
        ]);
        const insertId = result.insertId;
        const created = await this.getConnectionById(insertId, connection.user_id);
        return created;
    }
    async getConnectionById(id, userId) {
        const pool = await this.getPool();
        const [rows] = await pool.query('SELECT * FROM connections WHERE id = ? AND user_id = ?', [id, userId]);
        const recordset = rows;
        if (recordset.length === 0)
            return null;
        const conn = recordset[0];
        conn.password_encrypted = (0, encryption_1.decrypt)(conn.password_encrypted);
        return conn;
    }
    async getAllConnections(userId) {
        const pool = await this.getPool();
        const [rows] = await pool.query('SELECT * FROM connections WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        const recordset = rows;
        return recordset.map((conn) => {
            conn.password_encrypted = (0, encryption_1.decrypt)(conn.password_encrypted);
            return conn;
        });
    }
    async updateConnection(id, userId, updates) {
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
            fields.push('password_encrypted = ?');
            values.push((0, encryption_1.encrypt)(updates.password_encrypted));
        }
        if (updates.is_default !== undefined) {
            fields.push('is_default = ?');
            values.push(updates.is_default ? 1 : 0);
        }
        fields.push('updated_at = NOW()');
        values.push(id, userId);
        const query = `UPDATE connections SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;
        await pool.query(query, values);
        const updated = await this.getConnectionById(id, userId);
        return updated;
    }
    async deleteConnection(id, userId) {
        const pool = await this.getPool();
        const [result] = await pool.query('DELETE FROM connections WHERE id = ? AND user_id = ?', [id, userId]);
        return result.affectedRows > 0;
    }
}
exports.ConnectionService = ConnectionService;
exports.default = new ConnectionService();
//# sourceMappingURL=connectionService.js.map