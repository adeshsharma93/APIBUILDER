"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appDbConfig = void 0;
exports.getAppDbPool = getAppDbPool;
exports.getUserDbPool = getUserDbPool;
exports.testConnection = testConnection;
const mssql_1 = __importDefault(require("mssql"));
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
const encryption_1 = require("../utils/encryption");
dotenv_1.default.config();
// Application database configuration (stores users, APIs, logs, etc.) - MySQL
exports.appDbConfig = {
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
let appPool = null;
async function getAppDbPool() {
    if (!appPool) {
        appPool = promise_1.default.createPool(exports.appDbConfig);
        // Test the connection
        try {
            const connection = await appPool.getConnection();
            await connection.ping();
            connection.release();
            console.log('✅ Application database (MySQL) connected');
        }
        catch (error) {
            console.error('Failed to connect to MySQL:', error);
            throw error;
        }
    }
    return appPool;
}
const userDbPools = new Map();
async function getUserDbPool(connectionId) {
    if (userDbPools.has(connectionId)) {
        const cached = userDbPools.get(connectionId);
        return {
            type: cached.type,
            pool: cached.type === 'mysql' ? cached.mysqlPool : cached.mssqlPool,
            mysqlPool: cached.mysqlPool,
            mssqlPool: cached.mssqlPool
        };
    }
    const pool = await getAppDbPool();
    const [rows] = await pool.query('SELECT * FROM connections WHERE id = ?', [connectionId]);
    const recordset = rows;
    if (recordset.length === 0) {
        throw new Error('Database connection not found');
    }
    const conn = recordset[0];
    // Decrypt credentials
    const password = (0, encryption_1.decrypt)(conn.encrypted_password);
    if (conn.type === 'mysql') {
        const mysqlPool = promise_1.default.createPool({
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
    }
    else {
        const mssqlPool = await mssql_1.default.connect({
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
async function testConnection(config) {
    try {
        if (config.type === 'mysql') {
            const connection = await promise_1.default.createConnection({
                host: config.host,
                port: config.port,
                database: config.database,
                user: config.username,
                password: config.password,
            });
            await connection.ping();
            await connection.end();
            return true;
        }
        else {
            const pool = await mssql_1.default.connect({
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
    }
    catch (error) {
        console.error('Connection test failed:', error);
        return false;
    }
}
//# sourceMappingURL=database.js.map