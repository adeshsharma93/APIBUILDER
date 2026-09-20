import mysql from 'mysql2/promise';
import { encrypt, decrypt } from '../utils/encryption';

export interface Connection {
  id?: string;
  project_id: string;
  name: string;
  type: 'mysql' | 'sqlserver' | 'postgresql';
  host: string;
  port: number;
  database_name: string;
  username: string;
  password_encrypted: string;
  ssl_enabled?: boolean;
  connection_timeout?: number;
  status?: 'connected' | 'disconnected' | 'error';
  last_tested_at?: Date;
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

  async createConnection(connection: Connection): Promise<Connection> {
    const pool = await this.getPool();
    const encryptedPassword = encrypt(connection.password_encrypted);
    
    // Generate UUID for id
    const [uuidResult] = await pool.query("SELECT UUID() as id");
    const id = (uuidResult as any)[0].id;
    
    const [result] = await pool.query(
      `INSERT INTO database_connections 
       (id, project_id, name, type, host, port, database_name, username, encrypted_password, ssl_enabled, connection_timeout, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );

    const created = await this.getConnectionById(id, connection.project_id);
    return created!;
  }

  async getConnectionById(id: string, projectId: string): Promise<Connection | null> {
    const pool = await this.getPool();
    
    const [rows] = await pool.query(
      'SELECT * FROM database_connections WHERE id = ? AND project_id = ?',
      [id, projectId]
    );

    const recordset = rows as any[];
    if (recordset.length === 0) return null;
    
    const conn = recordset[0];
    // Don't decrypt here, only decrypt when needed for actual connection
    return conn;
  }

  async getAllConnections(projectId: string): Promise<Connection[]> {
    const pool = await this.getPool();
    
    const [rows] = await pool.query(
      'SELECT * FROM database_connections WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );

    return rows as any[];
  }

  async updateConnection(id: string, projectId: string, updates: Partial<Connection>): Promise<Connection | null> {
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
      fields.push('encrypted_password = ?');
      values.push(encrypt(updates.password_encrypted));
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

  async deleteConnection(id: string, projectId: string): Promise<boolean> {
    const pool = await this.getPool();
    
    const [result] = await pool.query(
      'DELETE FROM database_connections WHERE id = ? AND project_id = ?',
      [id, projectId]
    );

    return (result as any).affectedRows > 0;
  }
}

export default new ConnectionService();
