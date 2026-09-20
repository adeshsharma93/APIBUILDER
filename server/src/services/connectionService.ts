import mssql, { ConnectionPool } from 'mssql';
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
  is_default?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class ConnectionService {
  private pool: ConnectionPool | null = null;

  constructor() {}

  private async getPool(): Promise<ConnectionPool> {
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
      
      this.pool = await mssql.connect(config);
    }
    return this.pool;
  }

  async createConnection(connection: Connection): Promise<Connection> {
    const pool = await this.getPool();
    const encryptedPassword = encrypt(connection.password_encrypted);
    
    const result = await pool.request()
      .input('user_id', mssql.Int, connection.user_id)
      .input('name', mssql.NVarChar, connection.name)
      .input('type', mssql.NVarChar, connection.type)
      .input('host', mssql.NVarChar, connection.host || null)
      .input('port', mssql.Int, connection.port || null)
      .input('database_name', mssql.NVarChar, connection.database_name || null)
      .input('username', mssql.NVarChar, connection.username || null)
      .input('password_encrypted', mssql.NVarChar, encryptedPassword)
      .input('is_default', mssql.Bit, connection.is_default ? 1 : 0)
      .query(`
        INSERT INTO [dbo].[connections] 
        ([user_id], [name], [type], [host], [port], [database_name], [username], [password_encrypted], [is_default])
        OUTPUT INSERTED.*
        VALUES (@user_id, @name, @type, @host, @port, @database_name, @username, @password_encrypted, @is_default)
      `);

    const created = result.recordset[0];
    created.password_encrypted = decrypt(created.password_encrypted);
    return created;
  }

  async getConnectionById(id: number, userId: number): Promise<Connection | null> {
    const pool = await this.getPool();
    
    const result = await pool.request()
      .input('id', mssql.Int, id)
      .input('user_id', mssql.Int, userId)
      .query('SELECT * FROM [dbo].[connections] WHERE id = @id AND user_id = @user_id');

    if (result.recordset.length === 0) return null;
    
    const conn = result.recordset[0];
    conn.password_encrypted = decrypt(conn.password_encrypted);
    return conn;
  }

  async getAllConnections(userId: number): Promise<Connection[]> {
    const pool = await this.getPool();
    
    const result = await pool.request()
      .input('user_id', mssql.Int, userId)
      .query('SELECT * FROM [dbo].[connections] WHERE user_id = @user_id ORDER BY created_at DESC');

    return result.recordset.map((conn: any) => {
      conn.password_encrypted = decrypt(conn.password_encrypted);
      return conn;
    });
  }

  async updateConnection(id: number, userId: number, updates: Partial<Connection>): Promise<Connection | null> {
    const pool = await this.getPool();
    
    let query = 'UPDATE [dbo].[connections] SET ';
    const fields: string[] = [];
    
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
      updates.password_encrypted = encrypt(updates.password_encrypted);
    }
    if (updates.is_default !== undefined) {
      fields.push('[is_default] = @is_default');
    }
    
    fields.push('[updated_at] = GETDATE()');
    query += fields.join(', ');
    query += ' OUTPUT INSERTED.* WHERE id = @id AND user_id = @user_id';

    const request = pool.request()
      .input('id', mssql.Int, id)
      .input('user_id', mssql.Int, userId);

    if (updates.name !== undefined) request.input('name', mssql.NVarChar, updates.name);
    if (updates.host !== undefined) request.input('host', mssql.NVarChar, updates.host);
    if (updates.port !== undefined) request.input('port', mssql.Int, updates.port);
    if (updates.database_name !== undefined) request.input('database_name', mssql.NVarChar, updates.database_name);
    if (updates.username !== undefined) request.input('username', mssql.NVarChar, updates.username);
    if (updates.password_encrypted !== undefined) request.input('password_encrypted', mssql.NVarChar, updates.password_encrypted);
    if (updates.is_default !== undefined) request.input('is_default', mssql.Bit, updates.is_default ? 1 : 0);

    const result = await request.query(query);

    if (result.recordset.length === 0) return null;
    
    const conn = result.recordset[0];
    conn.password_encrypted = decrypt(conn.password_encrypted);
    return conn;
  }

  async deleteConnection(id: number, userId: number): Promise<boolean> {
    const pool = await this.getPool();
    
    const result = await pool.request()
      .input('id', mssql.Int, id)
      .input('user_id', mssql.Int, userId)
      .query('DELETE FROM [dbo].[connections] WHERE id = @id AND user_id = @user_id');

    return result.rowsAffected[0] > 0;
  }
}

export default new ConnectionService();
