import mysql from 'mysql2/promise';
import { encrypt, decrypt } from '../utils/encryption';

export interface Connection {
  id?: number;
  user_id: number;
  name: string;
  type: 'mysql' | 'sqlserver';
  host?: string;
  port?: number;
  database_name?: string;
  username?: string;
  password_encrypted: string;
  ssl_enabled?: boolean;
  is_default?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class ConnectionService {
  private pool: mysql.Pool | null = null;
  
  constructor() {}

  private async getPool(): Promise<mysql.Pool> {
    if (!this.pool) {
      this.pool = mysql.createPool({
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

  async createConnection(connection: Connection): Promise<Connection> {
    const pool = await this.getPool();
    const encryptedPassword = encrypt(connection.password_encrypted);
    
    const [result] = await pool.query(
      `INSERT INTO connections 
       (user_id, name, type, host, port, database_name, username, password_encrypted, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        connection.user_id,
        connection.name,
        connection.type,
        connection.host || null,
        connection.port || null,
        connection.database_name || null,
        connection.username || null,
        encryptedPassword,
        connection.is_default ? 1 : 0,
      ]
    );

    const insertId = (result as any).insertId;
    const created = await this.getConnectionById(insertId, connection.user_id);
    return created!;
  }

  async getConnectionById(id: number, userId: number): Promise<Connection | null> {
    const pool = await this.getPool();
    
    const [rows] = await pool.query(
      'SELECT * FROM connections WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    const recordset = rows as any[];
    if (recordset.length === 0) return null;
    
    const conn = recordset[0];
    conn.password_encrypted = decrypt(conn.password_encrypted);
    return conn;
  }

  async getAllConnections(userId: number): Promise<Connection[]> {
    const pool = await this.getPool();
    
    const [rows] = await pool.query(
      'SELECT * FROM connections WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const recordset = rows as any[];
    return recordset.map((conn: any) => {
      conn.password_encrypted = decrypt(conn.password_encrypted);
      return conn;
    });
  }

  async updateConnection(id: number, userId: number, updates: Partial<Connection>): Promise<Connection | null> {
    const pool = await this.getPool();
    
    const fields: string[] = [];
    const values: any[] = [];
    
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
      values.push(encrypt(updates.password_encrypted));
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

  async deleteConnection(id: number, userId: number): Promise<boolean> {
    const pool = await this.getPool();
    
    const [result] = await pool.query(
      'DELETE FROM connections WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    return (result as any).affectedRows > 0;
  }
}

export default new ConnectionService();
