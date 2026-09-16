import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Application database configuration (stores users, APIs, logs, etc.)
export const appDbConfig: sql.config = {
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
let appPool: sql.ConnectionPool | null = null;

export async function getAppDbPool(): Promise<sql.ConnectionPool> {
  if (!appPool) {
    appPool = await new sql.ConnectionPool(appDbConfig).connect();
    console.log('✅ Application database connected');
  }
  return appPool;
}

// Dynamic connection pools for user databases
const userDbPools: Map<string, sql.ConnectionPool> = new Map();

export async function getUserDbPool(connectionId: string): Promise<sql.ConnectionPool> {
  if (userDbPools.has(connectionId)) {
    return userDbPools.get(connectionId)!;
  }

  const pool = await getAppDbPool();
  const result = await pool.request()
    .input('id', connectionId)
    .query('SELECT * FROM database_connections WHERE id = @id');

  if (result.recordset.length === 0) {
    throw new Error('Database connection not found');
  }

  const conn = result.recordset[0];
  
  // Decrypt credentials
  const { decryptCredential } = await import('../utils/encryption');
  const password = await decryptCredential(conn.encrypted_password);

  const userPool = await new sql.ConnectionPool({
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
  }).connect();

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
    const pool = await new sql.ConnectionPool({
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
    }).connect();

    await pool.request().query('SELECT 1');
    await pool.close();
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}
