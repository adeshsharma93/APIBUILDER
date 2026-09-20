import mssql, { config as MssqlConfig, ConnectionPool } from 'mssql';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { decrypt } from '../utils/encryption';

dotenv.config();

// Application database configuration (stores users, APIs, logs, etc.) - MySQL
export const appDbConfig: mysql.PoolOptions = {
  host: process.env.MYSQL_DB_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_DB_PORT || '3306'),
  database: process.env.MYSQL_DB_NAME || 'SQLAPIBuilder',
  user: process.env.MYSQL_DB_USER || 'root',
  password: process.env.MYSQL_DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Connection pool for application database (MySQL)
let appPool: mysql.Pool | null = null;

export async function getAppDbPool(): Promise<mysql.Pool> {
  if (!appPool) {
    appPool = mysql.createPool(appDbConfig);
    // Test the connection
    try {
      const connection = await appPool.getConnection();
      await connection.ping();
      connection.release();
      console.log('✅ Application database (MySQL) connected');
    } catch (error) {
      console.error('Failed to connect to MySQL:', error);
      throw error;
    }
  }
  return appPool;
}

// Dynamic connection pools for user databases (support both MySQL and SQL Server)
interface UserDbPool {
  type: 'mysql' | 'sqlserver';
  mysqlPool?: mysql.Pool;
  mssqlPool?: ConnectionPool;
}

const userDbPools: Map<string, UserDbPool> = new Map();

export interface UserConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  encrypted_password: string;
  ssl_enabled: boolean;
  type: 'mysql' | 'sqlserver' | 'postgresql';
}

export async function getUserDbPool(connectionId: string): Promise<{ type: 'mysql' | 'sqlserver' | 'postgresql', pool: mysql.Pool | ConnectionPool, mysqlPool?: mysql.Pool, mssqlPool?: ConnectionPool }> {
  if (userDbPools.has(connectionId)) {
    const cached = userDbPools.get(connectionId)!;
    return { 
      type: cached.type, 
      pool: cached.type === 'mysql' ? cached.mysqlPool! : cached.mssqlPool!,
      mysqlPool: cached.mysqlPool,
      mssqlPool: cached.mssqlPool
    };
  }

  const pool = await getAppDbPool();
  const [rows] = await pool.query('SELECT * FROM database_connections WHERE id = ?', [connectionId]);
  
  const recordset = rows as any[];
  if (recordset.length === 0) {
    throw new Error('Database connection not found');
  }

  const conn: UserConnection = recordset[0];

  // Decrypt credentials
  const password = decrypt(conn.encrypted_password);

  if (conn.type === 'mysql') {
    const mysqlPool = mysql.createPool({
      host: conn.host,
      port: conn.port,
      database: conn.database_name,
      user: conn.username,
      password: password,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });

    userDbPools.set(connectionId, { type: 'mysql', mysqlPool });
    console.log(`✅ User MySQL database connected: ${conn.name}`);
    return { type: 'mysql', pool: mysqlPool };
  } else {
    const mssqlPool = await mssql.connect({
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

    userDbPools.set(connectionId, { type: 'sqlserver', mssqlPool });
    console.log(`✅ User SQL Server database connected: ${conn.name}`);
    return { type: 'sqlserver', pool: mssqlPool };
  }
}

export async function testConnection(config: {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  type: 'mysql' | 'sqlserver' | 'postgresql';
}): Promise<boolean> {
  try {
    if (config.type === 'mysql') {
      const connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
      });
      await connection.ping();
      await connection.end();
      return true;
    } else {
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
    }
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}
