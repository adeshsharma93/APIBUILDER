import { getAppDbPool, getUserDbPool, testConnection } from '../config/database';
import { encryptCredential, decryptCredential } from '../utils/encryption';
import { v4 as uuidv4 } from 'uuid';

export interface DatabaseConnection {
  id: string;
  project_id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
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
  type: string;
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
    const pool = await getAppDbPool();
    const id = uuidv4();

    // Encrypt the password
    const encrypted_password = await encryptCredential(input.password);

    const result = await pool.request()
      .input('id', id)
      .input('project_id', input.project_id)
      .input('name', input.name)
      .input('type', input.type)
      .input('host', input.host)
      .input('port', input.port)
      .input('database_name', input.database_name)
      .input('username', input.username)
      .input('encrypted_password', encrypted_password)
      .input('ssl_enabled', input.ssl_enabled)
      .input('connection_timeout', input.connection_timeout)
      .query(`
        INSERT INTO database_connections (
          id, project_id, name, type, host, port, database_name, 
          username, encrypted_password, ssl_enabled, connection_timeout
        ) OUTPUT INSERTED.*
        VALUES (
          @id, @project_id, @name, @type, @host, @port, @database_name,
          @username, @encrypted_password, @ssl_enabled, @connection_timeout
        )
      `);

    return this.formatConnection(result.recordset[0]);
  }

  /**
   * Get all connections for a project
   */
  async getConnections(projectId: string): Promise<DatabaseConnection[]> {
    const pool = await getAppDbPool();
    const result = await pool.request()
      .input('project_id', projectId)
      .query('SELECT * FROM database_connections WHERE project_id = @project_id ORDER BY created_at DESC');

    return result.recordset.map(this.formatConnection);
  }

  /**
   * Get a single connection by ID
   */
  async getConnection(id: string): Promise<DatabaseConnection | null> {
    const pool = await getAppDbPool();
    const result = await pool.request()
      .input('id', id)
      .query('SELECT * FROM database_connections WHERE id = @id');

    if (result.recordset.length === 0) {
      return null;
    }

    return this.formatConnection(result.recordset[0]);
  }

  /**
   * Test a database connection
   */
  async testConnection(id: string): Promise<{ success: boolean; error?: string }> {
    const connection = await this.getConnection(id);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    // Decrypt password
    const pool = await getAppDbPool();
    const dbResult = await pool.request()
      .input('id', id)
      .query('SELECT encrypted_password FROM database_connections WHERE id = @id');

    const password = await decryptCredential(dbResult.recordset[0].encrypted_password);

    // Test the connection
    const success = await testConnection({
      host: connection.host,
      port: connection.port,
      database: connection.database_name,
      username: connection.username,
      password,
      ssl: connection.ssl_enabled,
    });

    // Update status
    await pool.request()
      .input('id', id)
      .input('status', success ? 'connected' : 'error')
      .input('last_tested_at', new Date())
      .query(`
        UPDATE database_connections 
        SET status = @status, last_tested_at = @last_tested_at, updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `);

    if (!success) {
      return { success: false, error: 'Connection test failed' };
    }

    return { success: true };
  }

  /**
   * Delete a connection
   */
  async deleteConnection(id: string): Promise<void> {
    const pool = await getAppDbPool();
    await pool.request()
      .input('id', id)
      .query('DELETE FROM database_connections WHERE id = @id');
  }

  /**
   * Format database row to API response (never expose encrypted password)
   */
  private formatConnection(row: any): DatabaseConnection {
    return {
      id: row.id,
      project_id: row.project_id,
      name: row.name,
      type: row.type,
      host: row.host,
      port: row.port,
      database_name: row.database_name,
      username: row.username,
      ssl_enabled: row.ssl_enabled,
      connection_timeout: row.connection_timeout,
      status: row.status,
      last_tested_at: row.last_tested_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const databaseConnectionService = new DatabaseConnectionService();
