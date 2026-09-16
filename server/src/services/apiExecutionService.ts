import { getUserDbPool } from '../config/database';
import { validateSql, validateParameterType, convertParameterValue, addPagination, getCountQuery } from '../utils/sqlValidator';
import { getAppDbPool } from '../config/database';
import sql from 'mssql';

export interface ExecuteQueryInput {
  connectionId: string;
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

      // Get database connection pool
      const pool = await getUserDbPool(input.connectionId);

      // Create request with parameters
      const request = pool.request();

      // Set timeout
      if (input.timeout) {
        request.timeout = input.timeout * 1000;
      }

      // Add parameters (parameterized query - prevents SQL injection)
      for (const [name, value] of Object.entries(input.parameters)) {
        if (value !== undefined && value !== null) {
          request.input(name, value);
        }
      }

      let querySql = input.sql;

      // Add pagination if requested
      if (input.page && input.pageSize && validation.isSelect) {
        querySql = addPagination(querySql, input.page, input.pageSize);
      }

      // Execute query
      const result = await request.query(querySql);
      const executionTime = Date.now() - startTime;

      // Get total count for pagination
      let pagination = undefined;
      if (input.page && input.pageSize && validation.isSelect) {
        try {
          const countRequest = pool.request();
          for (const [name, value] of Object.entries(input.parameters)) {
            if (value !== undefined && value !== null) {
              countRequest.input(name, value);
            }
          }
          const countQuery = getCountQuery(input.sql);
          const countResult = await countRequest.query(countQuery);
          const total = countResult.recordset[0].total;

          pagination = {
            page: input.page,
            pageSize: input.pageSize,
            total,
            totalPages: Math.ceil(total / input.pageSize),
          };
        } catch (countError) {
          // If count fails, still return data
          console.error('Count query failed:', countError);
        }
      }

      return {
        success: true,
        data: result.recordset,
        rowCount: result.recordset.length,
        executionTime,
        pagination,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      // Handle timeout
      if (error.code === 'ETIMEOUT' || error.message?.includes('timeout')) {
        return {
          success: false,
          executionTime,
          error: {
            code: 'QUERY_TIMEOUT',
            message: 'The database query exceeded the configured timeout.',
          },
        };
      }

      // Handle other errors (never expose raw SQL errors to users)
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
   * Execute a saved API definition
   */
  async executeApi(apiId: string, parameters: Record<string, unknown>, page?: number, pageSize?: number): Promise<QueryResult> {
    const pool = await getAppDbPool();

    // Load API definition
    const apiResult = await pool.request()
      .input('api_id', apiId)
      .query(`
        SELECT a.*, q.sql_text, q.parameters as query_parameters, q.connection_id
        FROM apis a
        JOIN sql_queries q ON a.query_id = q.id
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

        // Convert parameter to correct type
        parameters[param.name] = convertParameterValue(value, param.type);
      }
    }

    // Execute query
    return this.executeQuery({
      connectionId: api.connection_id,
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
