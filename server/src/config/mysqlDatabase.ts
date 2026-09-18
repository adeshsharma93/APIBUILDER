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
    console.log(`✅ Using cached MySQL pool for connection: ${connectionId}`);
    return userMysqlPools.get(connectionId)!;
  }

  console.log(`🔍 Fetching connection details for: ${connectionId}`);
  const pool = await getMysqlPool();
  const [rows] = await pool.execute(
    'SELECT * FROM database_connections WHERE id = ?',
    [connectionId]
  );

  const result = rows as any[];
  if (result.length === 0) {
    console.error(`❌ Connection not found in database: ${connectionId}`);
    throw new Error(`Database connection not found with ID: ${connectionId}`);
  }

  const conn = result[0];
  console.log(`✅ Found connection: ${conn.name} (${conn.host}:${conn.port}/${conn.database_name})`);
  
  // Decrypt credentials
  try {
    const { decryptCredential } = await import('../utils/encryption');
    const password = await decryptCredential(conn.encrypted_password);
    console.log(`✅ Decrypted credentials for: ${conn.name}`);

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
      connectTimeout: 10000,
    });

    // Test the connection
    try {
      const testConn = await userPool.getConnection();
      await testConn.ping();
      testConn.release();
      console.log(`✅ Successfully connected to user database: ${conn.name}`);
    } catch (testError: any) {
      console.error(`❌ Failed to connect to user database: ${conn.name}`, testError.message);
      throw new Error(`Failed to connect to database: ${testError.message}`);
    }

    userMysqlPools.set(connectionId, userPool);
    console.log(`✅ User MySQL database pool created and cached: ${conn.name}`);
    
    return userPool;
  } catch (decryptError: any) {
    console.error(`❌ Failed to decrypt credentials for: ${conn.name}`, decryptError.message);
    throw new Error(`Failed to decrypt database credentials: ${decryptError.message}`);
  }
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
