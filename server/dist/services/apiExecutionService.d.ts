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
    rowsAffected?: number;
    executionTime?: number;
    message?: string;
    error?: {
        code: string;
        message: string;
    };
}
export declare class ApiExecutionService {
    /**
     * Execute a SQL query safely with parameterized queries
     */
    executeQuery(input: ExecuteQueryInput): Promise<QueryResult>;
    /**
     * Execute MySQL query
     */
    private executeMysqlQuery;
    /**
     * Execute SQL Server query
     */
    private executeSqlServerQuery;
    /**
     * Get total count for pagination
     */
    private getTotalCount;
    /**
     * Execute a saved API definition
     */
    executeApi(apiId: string, parameters: Record<string, unknown>, page?: number, pageSize?: number): Promise<QueryResult>;
    /**
     * Log API request
     */
    logRequest(apiId: string, apiKeyId: string | null, method: string, endpoint: string, statusCode: number, responseTime: number, parameters: Record<string, unknown>, ipAddress: string, userAgent: string, errorMessage: string | null): Promise<void>;
}
export declare const apiExecutionService: ApiExecutionService;
//# sourceMappingURL=apiExecutionService.d.ts.map