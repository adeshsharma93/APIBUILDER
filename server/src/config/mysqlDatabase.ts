import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// MySQL Application database configuration
export const mysqlAppDbConfig: mysql.ConnectionOptions = {
  host: process.env.MYSQL_DB_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_DB_PORT || '3306'),
  user: process.env.MYSQL_DB_USER || 'root',
  password: process.env.MYSQL_DB_PASSWORD || '',
  database: process.env.MYSQL_DB_NAME || 'sql_api_builder',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Connection pool for MySQL application database
let mysqlPool: mysql.Pool | null = null;

export async function getMysqlPool(): Promise<mysql.Pool> {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool(mysqlAppDbConfig);
    console.log('✅ MySQL application database connected');
  }
  return mysqlPool;
}

// Dynamic connection pools for user MySQL databases
const userMysqlPools: Map<string, mysql.Pool> = new Map();

export async function getUserMysqlPool(connectionId: string): Promise<mysql.Pool> {
  if (userMysqlPools.has(connectionId)) {
    return userMysqlPools.get(connectionId)!;
  }

  const pool = await getMysqlPool();
  const [rows] = await pool.execute(
    'SELECT * FROM database_connections WHERE id = ?',
    [connectionId]
  );

  const result = rows as any[];
  if (result.length === 0) {
    throw new Error('Database connection not found');
  }

  const conn = result[0];
  
  // Decrypt credentials
  const { decryptCredential } = await import('../utils/encryption');
  const password = await decryptCredential(conn.encrypted_password);

  const userPool = mysql.createPool({
    host: conn.host,
    port: conn.port,
    user: conn.username,
    password: password,
    database: conn.database_name,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    ssl: conn.ssl_enabled ? {} : undefined,
  });

  userMysqlPools.set(connectionId, userPool);
  console.log(`✅ User MySQL database connected: ${conn.name}`);
  
  return userPool;
}

export async function testMysqlConnection(config: {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}): Promise<boolean> {
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      connectTimeout: 5000,
      ssl: config.ssl ? {} : undefined,
    });

    await connection.execute('SELECT 1');
    await connection.end();
    return true;
  } catch (error) {
    console.error('MySQL connection test failed:', error);
    return false;
  }
}
