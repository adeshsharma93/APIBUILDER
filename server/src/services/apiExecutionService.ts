import { getUserMysqlPool, getMysqlPool } from '../config/mysqlDatabase';
import { getUserDbPool, getAppDbPool } from '../config/database';
import { validateSql, validateParameterType, convertParameterValue } from '../utils/sqlValidator';

export interface ExecuteQueryInput {
  connectionId: string;
  dbType: 'mysql' | 'sqlserver';
  sql: string;
  parameters: Record<string, unknown>;
  page?: number;
  pageSize?: number;
  timeout?: number;
  allowDangerous?: boolean;
}

export interface QueryResult {
  success: boolean;
  data?: any[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  rowCount?: number;
  executionTime?: number;
  error?: {
    code: string;
    message: string;
  };
}

export class ApiExecutionService {
  /**
   * Execute a SQL query safely with parameterized queries
   */
  async executeQuery(input: ExecuteQueryInput): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      // Validate SQL
      const validation = validateSql(input.sql, input.allowDangerous);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'INVALID_SQL',
            message: validation.error || 'Invalid SQL',
          },
        };
      }

      let result: any[];
      
      if (input.dbType === 'mysql') {
        result = await this.executeMysqlQuery(input, validation.isSelect);
      } else {
        result = await this.executeSqlServerQuery(input, validation.isSelect);
      }

      const executionTime = Date.now() - startTime;

      // Get total count for pagination
      let pagination = undefined;
      if (input.page && input.pageSize && validation.isSelect) {
        try {
          const total = await this.getTotalCount(input);
          pagination = {
            page: input.page,
            pageSize: input.pageSize,
            total,
            totalPages: Math.ceil(total / input.pageSize),
          };
        } catch (countError) {
          console.error('Count query failed:', countError);
        }
      }

      return {
        success: true,
        data: result,
        rowCount: result.length,
        executionTime,
        pagination,
      };
    } catch (error: any) {
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
  private async executeMysqlQuery(input: ExecuteQueryInput, isSelect: boolean): Promise<any[]> {
    const pool = await getUserMysqlPool(input.connectionId);
    
    // Convert @paramName to ? for MySQL
    let sql = input.sql;
    const paramValues: any[] = [];
    
    // Extract parameter names in order
    const paramRegex = /@(\w+)/g;
    const paramNames: string[] = [];
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
    
    // Add pagination for MySQL
    if (input.page && input.pageSize && isSelect) {
      const offset = (input.page - 1) * input.pageSize;
      sql += `\nLIMIT ${input.pageSize} OFFSET ${offset}`;
    }
    
    const [rows] = await pool.execute(sql, paramValues);
    return rows as any[];
  }

  /**
   * Execute SQL Server query
   */
  private async executeSqlServerQuery(input: ExecuteQueryInput, isSelect: boolean): Promise<any[]> {
    const pool = await getUserDbPool(input.connectionId);
    const request = pool.request();

    if (input.timeout) {
      (request as any).timeout = input.timeout * 1000;
    }

    // Add parameters
    for (const [name, value] of Object.entries(input.parameters)) {
      if (value !== undefined && value !== null) {
        request.input(name, value);
      }
    }

    let sql = input.sql;

    // Add pagination for SQL Server
    if (input.page && input.pageSize && isSelect) {
      const offset = (input.page - 1) * input.pageSize;
      if (!/ORDER\s+BY/i.test(sql)) {
        sql += '\nORDER BY (SELECT NULL)';
      }
      sql += `\nOFFSET ${offset} ROWS\nFETCH NEXT ${input.pageSize} ROWS ONLY`;
    }

    const result = await request.query(sql);
    return result.recordset;
  }

  /**
   * Get total count for pagination
   */
  private async getTotalCount(input: ExecuteQueryInput): Promise<number> {
    // Remove pagination and SELECT columns, replace with COUNT(*)
    let countSql = input.sql
      .replace(/ORDER\s+BY[\s\S]+$/i, '')
      .replace(/LIMIT\s+\d+(\s+OFFSET\s+\d+)?/i, '')
      .replace(/OFFSET\s+\d+\s+ROWS/i, '')
      .replace(/FETCH\s+NEXT\s+\d+\s+ROWS\s+ONLY/i, '');

    // Replace SELECT columns with COUNT(*)
    countSql = countSql.replace(/SELECT\s+[\s\S]+?\s+FROM/i, 'SELECT COUNT(*) as total FROM');

    if (input.dbType === 'mysql') {
      const pool = await getUserMysqlPool(input.connectionId);
      
      // Convert @paramName to ? for MySQL
      let sql = countSql;
      const paramValues: any[] = [];
      
      const paramRegex = /@(\w+)/g;
      const paramNames: string[] = [];
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
      const result = rows as any[];
      return result[0]?.total || 0;
    } else {
      const pool = await getUserDbPool(input.connectionId);
      const request = pool.request();
      
      for (const [name, value] of Object.entries(input.parameters)) {
        if (value !== undefined && value !== null) {
          request.input(name, value);
        }
      }
      
      const result = await request.query(countSql);
      return result.recordset[0]?.total || 0;
    }
  }

  /**
   * Execute a saved API definition
   */
  async executeApi(apiId: string, parameters: Record<string, unknown>, page?: number, pageSize?: number): Promise<QueryResult> {
    const appPool = await getAppDbPool();

    // Load API definition
    const apiResult = await appPool.request()
      .input('api_id', apiId)
      .query(`
        SELECT a.*, q.sql_text, q.parameters as query_parameters, q.connection_id, dc.type as db_type
        FROM apis a
        JOIN sql_queries q ON a.query_id = q.id
        JOIN database_connections dc ON q.connection_id = dc.id
        WHERE a.id = @api_id AND a.status = 'published'
      `);

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
        if (!validateParameterType(value, param.type)) {
          return {
            success: false,
            error: {
              code: 'INVALID_PARAMETER',
              message: `Parameter '${param.name}' must be of type ${param.type}.`,
            },
          };
        }

        parameters[param.name] = convertParameterValue(value, param.type);
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
  async logRequest(
    apiId: string,
    apiKeyId: string | null,
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    parameters: Record<string, unknown>,
    ipAddress: string,
    userAgent: string,
    errorMessage: string | null
  ): Promise<void> {
    const pool = await getAppDbPool();

    await pool.request()
      .input('api_id', apiId)
      .input('api_key_id', apiKeyId)
      .input('method', method)
      .input('endpoint', endpoint)
      .input('status_code', statusCode)
      .input('response_time', responseTime)
      .input('parameters', JSON.stringify(parameters))
      .input('ip_address', ipAddress)
      .input('user_agent', userAgent)
      .input('error_message', errorMessage)
      .query(`
        INSERT INTO api_request_logs (
          api_id, api_key_id, method, endpoint, status_code, response_time,
          parameters, ip_address, user_agent, error_message
        ) VALUES (
          @api_id, @api_key_id, @method, @endpoint, @status_code, @response_time,
          @parameters, @ip_address, @user_agent, @error_message
        )
      `);

    // Update API stats
    if (statusCode >= 400) {
      await pool.request()
        .input('api_id', apiId)
        .query(`
          UPDATE apis 
          SET error_count = error_count + 1,
              request_count = request_count + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = @api_id
        `);
    } else {
      await pool.request()
        .input('api_id', apiId)
        .input('response_time', responseTime)
        .query(`
          UPDATE apis 
          SET request_count = request_count + 1,
              avg_response_time = (avg_response_time * (request_count - 1) + @response_time) / request_count,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = @api_id
        `);
    }
  }
}

export const apiExecutionService = new ApiExecutionService();
