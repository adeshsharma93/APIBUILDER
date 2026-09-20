import mssql, { config, ConnectionPool } from 'mssql';
import dotenv from 'dotenv';
import { decrypt } from '../utils/encryption';

dotenv.config();

// Application database configuration (stores users, APIs, logs, etc.)
export const appDbConfig: config = {
  server: process.env.APP_DB_SERVER || 'localhost',
  database: process.env.APP_DB_NAME || 'SQLAPIBuilder',
  user: process.env.APP_DB_USER || 'sa',
  password: process.env.APP_DB_PASSWORD || '',
  port: parseInt(process.env.APP_DB_PORT || '1433'),
  options: {
    encrypt: process.env.APP_DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.APP_DB_TRUST_CERT === 'true',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Connection pool for application database
let appPool: ConnectionPool | null = null;

export async function getAppDbPool(): Promise<ConnectionPool> {
  if (!appPool) {
    appPool = await mssql.connect(appDbConfig);
    console.log('✅ Application database connected');
  }
  return appPool;
}

// Dynamic connection pools for user databases
const userDbPools: Map<string, ConnectionPool> = new Map();

export interface UserConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  encrypted_password: string;
  ssl_enabled: boolean;
  type: 'mysql' | 'sqlserver';
}

export async function getUserDbPool(connectionId: string): Promise<ConnectionPool> {
  if (userDbPools.has(connectionId)) {
    return userDbPools.get(connectionId)!;
  }

  const pool = await getAppDbPool();
  const result = await pool.request()
    .input('id', mssql.NVarChar, connectionId)
    .query('SELECT * FROM [dbo].[connections] WHERE id = @id');

  if (result.recordset.length === 0) {
    throw new Error('Database connection not found');
  }

  const conn: UserConnection = result.recordset[0];

  // Decrypt credentials
  const password = decrypt(conn.encrypted_password);

  const userPool = await mssql.connect({
    server: conn.host,
    database: conn.database_name,
    user: conn.username,
    password: password,
    port: conn.port,
    options: {
      encrypt: conn.ssl_enabled,
      trustServerCertificate: !conn.ssl_enabled,
      enableArithAbort: true,
    },
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  });

  userDbPools.set(connectionId, userPool);
  console.log(`✅ User database connected: ${conn.name}`);

  return userPool;
}

export async function testConnection(config: {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}): Promise<boolean> {
  try {
    const pool = await mssql.connect({
      server: config.host,
      database: config.database,
      user: config.username,
      password: config.password,
      port: config.port,
      options: {
        encrypt: config.ssl,
        trustServerCertificate: !config.ssl,
        enableArithAbort: true,
        connectTimeout: 5000,
      },
    });

    await pool.request().query('SELECT 1');
    await pool.close();
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}
