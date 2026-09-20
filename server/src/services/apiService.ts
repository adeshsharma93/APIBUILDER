import mssql, { ConnectionPool } from 'mssql';

export interface Api {
  id?: number;
  user_id: number;
  connection_id: number;
  name: string;
  description?: string;
  query: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  parameters?: any;
  is_published?: boolean;
  requires_auth?: boolean;
  rate_limit?: number;
  created_at?: Date;
  updated_at?: Date;
}

export class ApiService {
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

  async createApi(api: Api): Promise<Api> {
    const pool = await this.getPool();
    const parametersJson = api.parameters ? JSON.stringify(api.parameters) : null;
    
    const result = await pool.request()
      .input('user_id', mssql.Int, api.user_id)
      .input('connection_id', mssql.Int, api.connection_id)
      .input('name', mssql.NVarChar, api.name)
      .input('description', mssql.NVarChar, api.description || null)
      .input('query', mssql.NVarChar, api.query)
      .input('method', mssql.NVarChar, api.method)
      .input('endpoint', mssql.NVarChar, api.endpoint)
      .input('parameters', mssql.NVarChar, parametersJson)
      .input('is_published', mssql.Bit, api.is_published ? 1 : 0)
      .input('requires_auth', mssql.Bit, api.requires_auth !== false ? 1 : 0)
      .input('rate_limit', mssql.Int, api.rate_limit || 100)
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

  async getApiById(id: number, userId: number): Promise<Api | null> {
    const pool = await this.getPool();
    
    const result = await pool.request()
      .input('id', mssql.Int, id)
      .input('user_id', mssql.Int, userId)
      .query('SELECT * FROM [dbo].[apis] WHERE id = @id AND user_id = @user_id');

    if (result.recordset.length === 0) return null;
    
    const api = result.recordset[0];
    if (api.parameters) {
      api.parameters = JSON.parse(api.parameters);
    }
    return api;
  }

  async getAllApis(userId: number): Promise<Api[]> {
    const pool = await this.getPool();
    
    const result = await pool.request()
      .input('user_id', mssql.Int, userId)
      .query('SELECT * FROM [dbo].[apis] WHERE user_id = @user_id ORDER BY created_at DESC');

    return result.recordset.map((api: any) => {
      if (api.parameters) {
        api.parameters = JSON.parse(api.parameters);
      }
      return api;
    });
  }

  async updateApi(id: number, userId: number, updates: Partial<Api>): Promise<Api | null> {
    const pool = await this.getPool();
    
    let query = 'UPDATE [dbo].[apis] SET ';
    const fields: string[] = [];
    
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
      .input('id', mssql.Int, id)
      .input('user_id', mssql.Int, userId);

    if (updates.name !== undefined) request.input('name', mssql.NVarChar, updates.name);
    if (updates.description !== undefined) request.input('description', mssql.NVarChar, updates.description);
    if (updates.query !== undefined) request.input('query', mssql.NVarChar, updates.query);
    if (updates.method !== undefined) request.input('method', mssql.NVarChar, updates.method);
    if (updates.endpoint !== undefined) request.input('endpoint', mssql.NVarChar, updates.endpoint);
    if (updates.parameters !== undefined) request.input('parameters', mssql.NVarChar, JSON.stringify(updates.parameters));
    if (updates.is_published !== undefined) request.input('is_published', mssql.Bit, updates.is_published ? 1 : 0);
    if (updates.requires_auth !== undefined) request.input('requires_auth', mssql.Bit, updates.requires_auth ? 1 : 0);
    if (updates.rate_limit !== undefined) request.input('rate_limit', mssql.Int, updates.rate_limit);

    const result = await request.query(query);

    if (result.recordset.length === 0) return null;
    
    const api = result.recordset[0];
    if (api.parameters) {
      api.parameters = JSON.parse(api.parameters);
    }
    return api;
  }

  async deleteApi(id: number, userId: number): Promise<boolean> {
    const pool = await this.getPool();
    
    const result = await pool.request()
      .input('id', mssql.Int, id)
      .input('user_id', mssql.Int, userId)
      .query('DELETE FROM [dbo].[apis] WHERE id = @id AND user_id = @user_id');

    return result.rowsAffected[0] > 0;
  }

  async getApiByEndpoint(endpoint: string): Promise<Api | null> {
    const pool = await this.getPool();
    
    const result = await pool.request()
      .input('endpoint', mssql.NVarChar, endpoint)
      .query('SELECT * FROM [dbo].[apis] WHERE endpoint = @endpoint AND is_published = 1');

    if (result.recordset.length === 0) return null;
    
    const api = result.recordset[0];
    if (api.parameters) {
      api.parameters = JSON.parse(api.parameters);
    }
    return api;
  }
}

export default new ApiService();
