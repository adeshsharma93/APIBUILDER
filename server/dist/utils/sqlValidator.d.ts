/**
 * SQL Validator - Prevents dangerous SQL execution in public APIs
 *
 * This validator parses SQL statements and blocks dangerous operations
 * unless explicitly allowed for trusted administrators.
 */
export interface ValidationResult {
    valid: boolean;
    error?: string;
    parameters: string[];
    isSelect: boolean;
}
/**
 * Validate SQL query for safety
 */
export declare function validateSql(sql: string, allowDangerous?: boolean): ValidationResult;
/**
 * Validate parameter types
 */
export declare function validateParameterType(value: unknown, type: string): boolean;
/**
 * Convert parameter value to SQL type
 */
export declare function convertParameterValue(value: unknown, type: string): unknown;
/**
 * Add pagination to SQL query (SQL Server syntax)
 */
export declare function addPagination(sql: string, page: number, pageSize: number): string;
/**
 * Wrap query to get total count for pagination
 */
export declare function getCountQuery(sql: string): string;
//# sourceMappingURL=sqlValidator.d.ts.map