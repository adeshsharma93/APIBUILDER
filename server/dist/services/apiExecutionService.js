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
exports.apiExecutionService = exports.ApiExecutionService = void 0;
const mssql_1 = __importDefault(require("mssql"));
const mysqlDatabase_1 = require("../config/mysqlDatabase");
const database_1 = require("../config/database");
const sqlValidator_1 = require("../utils/sqlValidator");
class ApiExecutionService {
    /**
     * Execute a SQL query safely with parameterized queries
     */
    async executeQuery(input) {
        const startTime = Date.now();
        try {
            // Validate SQL
            const validation = (0, sqlValidator_1.validateSql)(input.sql, input.allowDangerous);
            if (!validation.valid) {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_SQL',
                        message: validation.error || 'Invalid SQL',
                    },
                };
            }
            let result;
            if (input.dbType === 'mysql') {
                result = await this.executeMysqlQuery(input, validation.isSelect);
            }
            else {
                result = await this.executeSqlServerQuery(input, validation.isSelect);
            }
            const executionTime = Date.now() - startTime;
            // Handle write operations (INSERT/UPDATE/DELETE)
            if (!validation.isSelect) {
                return {
                    success: true,
                    data: [],
                    rowsAffected: result,
                    rowCount: 0,
                    executionTime,
                    message: `Query executed successfully. ${result} row(s) affected.`,
                };
            }
            // Handle SELECT queries
            const data = result;
            // Get total count for pagination
            let pagination = undefined;
            if (input.page && input.pageSize) {
                try {
                    const total = await this.getTotalCount(input);
                    pagination = {
                        page: input.page,
                        pageSize: input.pageSize,
                        total,
                        totalPages: Math.ceil(total / input.pageSize),
                    };
                }
                catch (countError) {
                    console.error('Count query failed:', countError);
                }
            }
            return {
                success: true,
                data,
                rowCount: data.length,
                executionTime,
                pagination,
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            // Handle timeout
            if (error.code === 'ETIMEOUT' || error.code === 'PROTOCOL_SEQUENCE_TIMEOUT' || error.message?.includes('timeout')) {
                return {
                    success: false,
                    executionTime,
                    error: {
                        code: 'QUERY_TIMEOUT',
                        message: 'The database query exceeded the configured timeout.',
                    },
                };
            }
            console.error('Query execution error:', error);
            return {
                success: false,
                executionTime,
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'An error occurred while executing the query.',
                },
            };
        }
    }
    /**
     * Execute MySQL query
     */
    async executeMysqlQuery(input, isSelect) {
        const pool = await (0, mysqlDatabase_1.getUserMysqlPool)(input.connectionId);
        // Convert @paramName to ? for MySQL
        let sql = input.sql;
        const paramValues = [];
        // Extract parameter names in order
        const paramRegex = /@(\w+)/g;
        const paramNames = [];
        let match;
        while ((match = paramRegex.exec(sql)) !== null) {
            if (!paramNames.includes(match[1])) {
                paramNames.push(match[1]);
            }
        }
        // Replace @paramName with ?
        sql = sql.replace(/@\w+/g, '?');
        // Add parameter values in order
        for (const name of paramNames) {
            if (input.parameters[name] !== undefined) {
                paramValues.push(input.parameters[name]);
            }
        }
        // Remove trailing semicolon before adding pagination
        sql = sql.replace(/;\s*$/, '');
        // Add pagination for MySQL (only for SELECT, and only if not already present)
        if (input.page && input.pageSize && isSelect && !/LIMIT\s+\d+/i.test(sql)) {
            const offset = (input.page - 1) * input.pageSize;
            sql += `\nLIMIT ${input.pageSize} OFFSET ${offset}`;
        }
        const [result] = await pool.execute(sql, paramValues);
        // For SELECT queries, return rows
        if (isSelect) {
            return result;
        }
        // For INSERT/UPDATE/DELETE, return affected rows count
        return result.affectedRows || 0;
    }
    /**
     * Execute SQL Server query
     */
    async executeSqlServerQuery(input, isSelect) {
        const dbPool = await (0, database_1.getUserDbPool)(input.connectionId);
        const pool = dbPool.mssqlPool;
        if (!pool)
            throw new Error('SQL Server pool not found');
        const request = pool.request();
        if (input.timeout) {
            request.timeout = input.timeout * 1000;
        }
        // Add parameters
        for (const [name, value] of Object.entries(input.parameters)) {
            if (value !== undefined && value !== null) {
                request.input(name, mssql_1.default.NVarChar, value);
            }
        }
        let sql = input.sql;
        // Remove trailing semicolon before adding pagination
        sql = sql.replace(/;\s*$/, '');
        // Add pagination for SQL Server (only for SELECT, and only if not already present)
        if (input.page && input.pageSize && isSelect && !/OFFSET\s+\d+\s+ROWS/i.test(sql)) {
            const offset = (input.page - 1) * input.pageSize;
            if (!/ORDER\s+BY/i.test(sql)) {
                sql += '\nORDER BY (SELECT NULL)';
            }
            sql += `\nOFFSET ${offset} ROWS\nFETCH NEXT ${input.pageSize} ROWS ONLY`;
        }
        const result = await request.query(sql);
        // For SELECT queries, return recordset
        if (isSelect) {
            return result.recordset;
        }
        // For INSERT/UPDATE/DELETE, return rows affected
        return result.rowsAffected[0] || 0;
    }
    /**
     * Get total count for pagination
     */
    async getTotalCount(input) {
        // Remove pagination and SELECT columns, replace with COUNT(*)
        let countSql = input.sql
            .replace(/;\s*$/, '') // Remove trailing semicolon
            .replace(/ORDER\s+BY[\s\S]+$/i, '')
            .replace(/LIMIT\s+\d+(\s+OFFSET\s+\d+)?/i, '')
            .replace(/OFFSET\s+\d+\s+ROWS/i, '')
            .replace(/FETCH\s+NEXT\s+\d+\s+ROWS\s+ONLY/i, '');
        // Replace SELECT columns with COUNT(*)
        countSql = countSql.replace(/SELECT\s+[\s\S]+?\s+FROM/i, 'SELECT COUNT(*) as total FROM');
        if (input.dbType === 'mysql') {
            const pool = await (0, mysqlDatabase_1.getUserMysqlPool)(input.connectionId);
            // Convert @paramName to ? for MySQL
            let sql = countSql;
            const paramValues = [];
            const paramRegex = /@(\w+)/g;
            const paramNames = [];
            let match;
            while ((match = paramRegex.exec(sql)) !== null) {
                if (!paramNames.includes(match[1])) {
                    paramNames.push(match[1]);
                }
            }
            sql = sql.replace(/@\w+/g, '?');
            for (const name of paramNames) {
                if (input.parameters[name] !== undefined) {
                    paramValues.push(input.parameters[name]);
                }
            }
            const [rows] = await pool.execute(sql, paramValues);
            const result = rows;
            return result[0]?.total || 0;
        }
        else {
            const dbPool = await (0, database_1.getUserDbPool)(input.connectionId);
            const pool = dbPool.mssqlPool;
            if (!pool)
                throw new Error('SQL Server pool not found');
            const request = pool.request();
            for (const [name, value] of Object.entries(input.parameters)) {
                if (value !== undefined && value !== null) {
                    request.input(name, mssql_1.default.NVarChar, value);
                }
            }
            const result = await request.query(countSql);
            return result.recordset[0]?.total || 0;
        }
    }
    /**
     * Execute a saved API definition
     */
    async executeApi(apiId, parameters, page, pageSize) {
        const appPool = await (0, database_1.getAppDbPool)();
        // Load API definition using MySQL syntax
        const [apiRows] = await appPool.query(`
      SELECT a.*, q.sql_text, q.parameters as query_parameters, q.connection_id, dc.type as db_type
      FROM apis a
      JOIN sql_queries q ON a.query_id = q.id
      JOIN database_connections dc ON q.connection_id = dc.id
      WHERE a.id = ? AND a.status = 'published'
    `, [apiId]);
        const apiResult = { recordset: apiRows };
        if (apiResult.recordset.length === 0) {
            return {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'API not found or not published.',
                },
            };
        }
        const api = apiResult.recordset[0];
        // Validate that the database connection still exists and is active
        const { databaseConnectionService } = await Promise.resolve().then(() => __importStar(require('./databaseConnectionService')));
        const connection = await databaseConnectionService.getConnection(api.connection_id, api.db_type);
        if (!connection) {
            return {
                success: false,
                error: {
                    code: 'CONNECTION_NOT_FOUND',
                    message: 'Database connection no longer exists. Please update the API configuration.',
                },
            };
        }
        if (connection.status !== 'connected') {
            return {
                success: false,
                error: {
                    code: 'CONNECTION_NOT_ACTIVE',
                    message: `Database connection is not active (status: ${connection.status}). Please test the connection.`,
                },
            };
        }
        // Validate parameters
        const queryParams = JSON.parse(api.query_parameters || '[]');
        for (const param of queryParams) {
            if (param.required && !(param.name in parameters)) {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_PARAMETER',
                        message: `Missing required parameter: ${param.name}`,
                    },
                };
            }
            if (param.name in parameters) {
                const value = parameters[param.name];
                if (!(0, sqlValidator_1.validateParameterType)(value, param.type)) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_PARAMETER',
                            message: `Parameter '${param.name}' must be of type ${param.type}.`,
                        },
                    };
                }
                parameters[param.name] = (0, sqlValidator_1.convertParameterValue)(value, param.type);
            }
        }
        // Execute query
        return this.executeQuery({
            connectionId: api.connection_id,
            dbType: api.db_type,
            sql: api.sql_text,
            parameters,
            page: page || (api.pagination_enabled ? 1 : undefined),
            pageSize: pageSize || api.page_size,
            timeout: api.timeout,
            allowDangerous: false,
        });
    }
    /**
     * Log API request
     */
    async logRequest(apiId, apiKeyId, method, endpoint, statusCode, responseTime, parameters, ipAddress, userAgent, errorMessage) {
        const pool = await (0, database_1.getAppDbPool)();
        await pool.query(`
      INSERT INTO api_request_logs (
        api_id, api_key_id, method, endpoint, status_code, response_time,
        parameters, ip_address, user_agent, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [apiId, apiKeyId, method, endpoint, statusCode, responseTime, JSON.stringify(parameters), ipAddress, userAgent, errorMessage]);
        // Update API stats
        if (statusCode >= 400) {
            await pool.query(`
        UPDATE apis 
        SET error_count = error_count + 1,
            request_count = request_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [apiId]);
        }
        else {
            await pool.query(`
        UPDATE apis 
        SET request_count = request_count + 1,
            avg_response_time = (avg_response_time * (request_count - 1) + ?) / request_count,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [responseTime, apiId]);
        }
    }
}
exports.ApiExecutionService = ApiExecutionService;
exports.apiExecutionService = new ApiExecutionService();
//# sourceMappingURL=apiExecutionService.js.map