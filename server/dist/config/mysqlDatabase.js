"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mysqlAppDbConfig = void 0;
exports.getMysqlPool = getMysqlPool;
exports.removeUserMysqlPool = removeUserMysqlPool;
exports.clearAllUserPools = clearAllUserPools;
exports.getUserMysqlPool = getUserMysqlPool;
exports.testMysqlConnection = testMysqlConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env from server directory
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
// MySQL Application database configuration
const MYSQL_PASSWORD = process.env.MYSQL_DB_PASSWORD;
if (!MYSQL_PASSWORD) {
    console.error('❌ ERROR: MYSQL_DB_PASSWORD is not set in .env file!');
    console.error('📝 Please create server/.env file with your MySQL password:');
    console.error('   MYSQL_DB_PASSWORD=your_mysql_password_here');
    console.error('');
    console.error('📖 See server/.env.example for reference');
    throw new Error('MySQL password not configured. Please set MYSQL_DB_PASSWORD in server/.env');
}
exports.mysqlAppDbConfig = {
    host: process.env.MYSQL_DB_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_DB_PORT || '3306'),
    user: process.env.MYSQL_DB_USER || 'root',
    password: MYSQL_PASSWORD,
    database: process.env.MYSQL_DB_NAME || 'sql_api_builder',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
};
// Connection pool for MySQL application database
let mysqlPool = null;
async function getMysqlPool() {
    if (!mysqlPool) {
        try {
            mysqlPool = promise_1.default.createPool(exports.mysqlAppDbConfig);
            // Test the connection
            const connection = await mysqlPool.getConnection();
            await connection.ping();
            connection.release();
            console.log('✅ MySQL application database connected');
            console.log(`   Host: ${exports.mysqlAppDbConfig.host}`);
            console.log(`   Database: ${exports.mysqlAppDbConfig.database}`);
            console.log(`   User: ${exports.mysqlAppDbConfig.user}`);
        }
        catch (error) {
            console.error('❌ Failed to connect to MySQL application database');
            console.error(`   Error: ${error.message}`);
            console.error('');
            console.error('💡 Troubleshooting:');
            console.error('   1. Check if MySQL is running');
            console.error('   2. Verify credentials in server/.env');
            console.error('   3. Ensure database exists: CREATE DATABASE sql_api_builder;');
            console.error('   4. Check user permissions');
            throw error;
        }
    }
    return mysqlPool;
}
// Dynamic connection pools for user MySQL databases
const userMysqlPools = new Map();
/**
 * Remove and close a user database connection pool
 * Call this when a connection is deleted or credentials change
 */
function removeUserMysqlPool(connectionId) {
    const pool = userMysqlPools.get(connectionId);
    if (pool) {
        pool.end().then(() => {
            console.log(`🗑️ Removed and closed pool for connection: ${connectionId}`);
        }).catch((error) => {
            console.error(`❌ Error closing pool for connection ${connectionId}:`, error.message);
        });
        userMysqlPools.delete(connectionId);
    }
}
/**
 * Clear all cached connection pools
 * Useful for cleanup or testing
 */
async function clearAllUserPools() {
    const connectionIds = Array.from(userMysqlPools.keys());
    for (const id of connectionIds) {
        removeUserMysqlPool(id);
    }
    console.log(`🗑️ Cleared all ${connectionIds.length} user connection pools`);
}
async function getUserMysqlPool(connectionId) {
    if (userMysqlPools.has(connectionId)) {
        console.log(`✅ Using cached MySQL pool for connection: ${connectionId}`);
        return userMysqlPools.get(connectionId);
    }
    console.log(`🔍 Fetching connection details for: ${connectionId}`);
    const pool = await getMysqlPool();
    const [rows] = await pool.execute('SELECT * FROM database_connections WHERE id = ?', [connectionId]);
    const result = rows;
    if (result.length === 0) {
        console.error(`❌ Connection not found in database: ${connectionId}`);
        throw new Error(`Database connection not found with ID: ${connectionId}`);
    }
    const conn = result[0];
    console.log(`✅ Found connection: ${conn.name} (${conn.host}:${conn.port}/${conn.database_name})`);
    // Decrypt credentials
    try {
        const { decryptCredential } = await Promise.resolve().then(() => __importStar(require('../utils/encryption')));
        const password = await decryptCredential(conn.encrypted_password);
        console.log(`✅ Decrypted credentials for: ${conn.name}`);
        const userPool = promise_1.default.createPool({
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
        }
        catch (testError) {
            console.error(`❌ Failed to connect to user database: ${conn.name}`, testError.message);
            throw new Error(`Failed to connect to database: ${testError.message}`);
        }
        userMysqlPools.set(connectionId, userPool);
        console.log(`✅ User MySQL database pool created and cached: ${conn.name}`);
        return userPool;
    }
    catch (decryptError) {
        console.error(`❌ Failed to decrypt credentials for: ${conn.name}`, decryptError.message);
        throw new Error(`Failed to decrypt database credentials: ${decryptError.message}`);
    }
}
async function testMysqlConnection(config) {
    try {
        const connection = await promise_1.default.createConnection({
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
    }
    catch (error) {
        console.error('MySQL connection test failed:', error);
        return false;
    }
}
//# sourceMappingURL=mysqlDatabase.js.map