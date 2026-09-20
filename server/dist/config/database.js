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
const dotenv_1 = __importDefault(require("dotenv"));
const encryption_1 = require("../utils/encryption");
dotenv_1.default.config();
// Application database configuration (stores users, APIs, logs, etc.)
exports.appDbConfig = {
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
let appPool = null;
async function getAppDbPool() {
    if (!appPool) {
        appPool = await mssql_1.default.connect(exports.appDbConfig);
        console.log('✅ Application database connected');
    }
    return appPool;
}
// Dynamic connection pools for user databases
const userDbPools = new Map();
async function getUserDbPool(connectionId) {
    if (userDbPools.has(connectionId)) {
        return userDbPools.get(connectionId);
    }
    const pool = await getAppDbPool();
    const result = await pool.request()
        .input('id', mssql_1.default.NVarChar, connectionId)
        .query('SELECT * FROM [dbo].[connections] WHERE id = @id');
    if (result.recordset.length === 0) {
        throw new Error('Database connection not found');
    }
    const conn = result.recordset[0];
    // Decrypt credentials
    const password = (0, encryption_1.decrypt)(conn.encrypted_password);
    const userPool = await mssql_1.default.connect({
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
async function testConnection(config) {
    try {
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
    catch (error) {
        console.error('Connection test failed:', error);
        return false;
    }
}
//# sourceMappingURL=database.js.map