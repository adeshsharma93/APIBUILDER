import mssql from 'mssql';
import { getMysqlPool, getUserMysqlPool, testMysqlConnection } from '../config/mysqlDatabase';
import { getAppDbPool, getUserDbPool, testConnection as testSqlServerConnection } from '../config/database';
import { encryptCredential, decryptCredential } from '../utils/encryption';
import { v4 as uuidv4 } from 'uuid';

/**
 * Convert ISO datetime to MySQL datetime format
 * MySQL expects: 'YYYY-MM-DD HH:MM:SS'
 * ISO format: 'YYYY-MM-DDTHH:MM:SS.sssZ'
 */
function toMysqlDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export interface DatabaseConnection {
  id: string;
  project_id: string;
  name: string;
  type: 'mysql' | 'sqlserver' | 'postgresql';
  host: string;
  port: number;
  database_name: string;
  username: string;
  encrypted_password?: string; // Optional - never expose in API responses
  ssl_enabled: boolean;
  connection_timeout: number;
  status: string;
  last_tested_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateConnectionInput {
  project_id: string;
  name: string;
  type: 'mysql' | 'sqlserver' | 'postgresql';
  host: string;
  port: number;
  database_name: string;
  username: string;
  password: string;
  ssl_enabled: boolean;
  connection_timeout: number;
}

export class DatabaseConnectionService {
  /**
   * Create a new database connection
   */
  async createConnection(input: CreateConnectionInput): Promise<DatabaseConnection> {
    const id = uuidv4();
    const encrypted_password = await encryptCredential(input.password);
    const now = new Date();
    const mysqlNow = toMysqlDateTime(now);

    if (input.type === 'mysql') {
      const pool = await getMysqlPool();
      await pool.execute(
        `INSERT INTO database_connections 
         (id, project_id, name, type, host, port, database_name, username, encrypted_password, ssl_enabled, connection_timeout, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, input.project_id, input.name, input.type, input.host, input.port, input.database_name, input.username, encrypted_password, input.ssl_enabled, input.connection_timeout, mysqlNow, mysqlNow]
      );
    } else {
      // SQL Server - use MySQL syntax since app DB is MySQL
      const pool = await getAppDbPool();
      const sqlNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await pool.query(`
        INSERT INTO database_connections 
        (id, project_id, name, type, host, port, database_name, username, encrypted_password, ssl_enabled, connection_timeout, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, input.project_id, input.name, input.type, input.host, input.port, input.database_name, input.username, encrypted_password, input.ssl_enabled, input.connection_timeout, sqlNow, sqlNow]);
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
  async getConnections(projectId: string, type: 'mysql' | 'sqlserver' = 'mysql'): Promise<DatabaseConnection[]> {
    if (type === 'mysql') {
      const pool = await getMysqlPool();
      const [rows] = await pool.execute(
        'SELECT * FROM database_connections WHERE project_id = ? ORDER BY created_at DESC',
        [projectId]
      );
      return rows as DatabaseConnection[];
    } else {
      const pool = await getAppDbPool();
      const [rows] = await pool.query(
        'SELECT * FROM database_connections WHERE project_id = ? ORDER BY created_at DESC',
        [projectId]
      );
      return rows as DatabaseConnection[];
    }
  }

  /**
   * Get a single connection by ID
   */
  async getConnection(id: string, type: 'mysql' | 'sqlserver' = 'mysql'): Promise<DatabaseConnection | null> {
    if (type === 'mysql') {
      const pool = await getMysqlPool();
      const [rows] = await pool.execute(
        'SELECT * FROM database_connections WHERE id = ?',
        [id]
      );
      const result = rows as any[];
      return result.length > 0 ? result[0] : null;
    } else {
      const pool = await getAppDbPool();
      const [rows] = await pool.query(
        'SELECT * FROM database_connections WHERE id = ?',
        [id]
      );
      const result = rows as any[];
      return result.length > 0 ? result[0] : null;
    }
  }

  /**
   * Test a database connection
   */
  async testConnection(id: string, type: 'mysql' | 'sqlserver' = 'mysql'): Promise<{ success: boolean; error?: string }> {
    const connection = await this.getConnection(id, type);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    // Decrypt password
    const password = await decryptCredential(connection.encrypted_password!);

    // Test the connection
    let success: boolean;
    if (type === 'mysql') {
      success = await testMysqlConnection({
        host: connection.host,
        port: connection.port,
        database: connection.database_name,
        username: connection.username,
        password,
        ssl: connection.ssl_enabled,
      });
    } else {
      success = await testSqlServerConnection({
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
      const pool = await getMysqlPool();
      await pool.execute(
        'UPDATE database_connections SET status = ?, last_tested_at = ?, updated_at = ? WHERE id = ?',
        [status, mysqlNow, mysqlNow, id]
      );
    } else {
      const pool = await getAppDbPool();
      await pool.request()
        .input('id', mssql.NVarChar, id)
         .input('status', mssql.NVarChar, status)
         .input('last_tested_at', mssql.DateTime, now)
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
  async deleteConnection(id: string, type: 'mysql' | 'sqlserver' = 'mysql'): Promise<void> {
    if (type === 'mysql') {
      const pool = await getMysqlPool();
      await pool.execute('DELETE FROM database_connections WHERE id = ?', [id]);
    } else {
      const pool = await getAppDbPool();
      await pool.request()
        .input('id', mssql.NVarChar, id)
        .query('DELETE FROM database_connections WHERE id = @id');
    }
  }

  /**
   * Get user database pool (for executing queries)
   */
  async getUserDbPool(connectionId: string, type: 'mysql' | 'sqlserver' = 'mysql') {
    if (type === 'mysql') {
      return getUserMysqlPool(connectionId);
    } else {
      return getUserDbPool(connectionId);
    }
  }
}

export const databaseConnectionService = new DatabaseConnectionService();
