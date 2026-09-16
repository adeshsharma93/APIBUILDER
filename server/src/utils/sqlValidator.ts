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

// Dangerous SQL keywords that should be blocked in public APIs
const DANGEROUS_KEYWORDS = [
  'DROP',
  'TRUNCATE',
  'ALTER',
  'CREATE',
  'GRANT',
  'REVOKE',
  'DELETE',
  'UPDATE',
  'INSERT',
  'EXEC',
  'EXECUTE',
  'XP_CMDSHELL',
  'SP_EXECUTESQL',
  'DBCC',
  'BACKUP',
  'RESTORE',
  'SHUTDOWN',
];

// Allowed SQL keywords for SELECT queries
const ALLOWED_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'AND',
  'OR',
  'NOT',
  'IN',
  'BETWEEN',
  'LIKE',
  'IS',
  'NULL',
  'JOIN',
  'INNER',
  'LEFT',
  'RIGHT',
  'OUTER',
  'ON',
  'ORDER',
  'BY',
  'ASC',
  'DESC',
  'GROUP',
  'HAVING',
  'DISTINCT',
  'TOP',
  'OFFSET',
  'FETCH',
  'NEXT',
  'ROWS',
  'ONLY',
  'AS',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'WITH',
];

/**
 * Validate SQL query for safety
 */
export function validateSql(sql: string, allowDangerous: boolean = false): ValidationResult {
  const normalizedSql = sql.trim().toUpperCase();
  
  // Extract parameters (@paramName)
  const paramRegex = /@(\w+)/g;
  const parameters: string[] = [];
  let match;
  while ((match = paramRegex.exec(sql)) !== null) {
    if (!parameters.includes(match[1])) {
      parameters.push(match[1]);
    }
  }

  // Check if it's a SELECT statement
  const isSelect = normalizedSql.startsWith('SELECT') || normalizedSql.startsWith('WITH');

  // If dangerous operations are allowed (admin mode), skip security checks
  if (allowDangerous) {
    return {
      valid: true,
      parameters,
      isSelect,
    };
  }

  // Block dangerous keywords
  for (const keyword of DANGEROUS_KEYWORDS) {
    // Use word boundary matching to avoid false positives
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(normalizedSql)) {
      return {
        valid: false,
        error: `Dangerous SQL operation detected: ${keyword}. This operation is not allowed in public APIs.`,
        parameters,
        isSelect,
      };
    }
  }

  // Ensure it's a SELECT or WITH (CTE) statement
  if (!isSelect) {
    return {
      valid: false,
      error: 'Only SELECT statements are allowed in public APIs.',
      parameters,
      isSelect,
    };
  }

  // Check for SQL injection patterns
  const injectionPatterns = [
    /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|EXEC)/i,
    /--\s*(DROP|DELETE|UPDATE|INSERT)/i,
    /\/\*.*\*\/\s*(DROP|DELETE|UPDATE|INSERT)/i,
    /UNION\s+SELECT/i, // Allow UNION SELECT but flag it
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(sql)) {
      return {
        valid: false,
        error: 'Potential SQL injection pattern detected.',
        parameters,
        isSelect,
      };
    }
  }

  return {
    valid: true,
    parameters,
    isSelect,
  };
}

/**
 * Validate parameter types
 */
export function validateParameterType(value: unknown, type: string): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'decimal':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean' || value === 'true' || value === 'false';
    case 'date':
      return typeof value === 'string' && !isNaN(Date.parse(value));
    case 'datetime':
      return typeof value === 'string' && !isNaN(Date.parse(value));
    default:
      return true;
  }
}

/**
 * Convert parameter value to SQL type
 */
export function convertParameterValue(value: unknown, type: string): unknown {
  switch (type) {
    case 'string':
      return String(value);
    case 'integer':
      return parseInt(String(value), 10);
    case 'decimal':
      return parseFloat(String(value));
    case 'boolean':
      if (typeof value === 'boolean') return value;
      return value === 'true' || value === '1';
    case 'date':
    case 'datetime':
      return new Date(String(value));
    default:
      return value;
  }
}

/**
 * Add pagination to SQL query (SQL Server syntax)
 */
export function addPagination(sql: string, page: number, pageSize: number): string {
  const offset = (page - 1) * pageSize;
  
  // Check if query already has OFFSET
  if (/OFFSET\s+\d+/i.test(sql)) {
    return sql;
  }

  // Add ORDER BY if not present (required for OFFSET)
  if (!/ORDER\s+BY/i.test(sql)) {
    sql += '\nORDER BY (SELECT NULL)';
  }

  // Add OFFSET and FETCH
  sql += `\nOFFSET ${offset} ROWS\nFETCH NEXT ${pageSize} ROWS ONLY`;

  return sql;
}

/**
 * Wrap query to get total count for pagination
 */
export function getCountQuery(sql: string): string {
  // Remove SELECT clause and replace with COUNT(*)
  const selectMatch = sql.match(/SELECT\s+([\s\S]+?)\s+FROM/i);
  if (!selectMatch) {
    throw new Error('Invalid SQL: Could not parse SELECT clause');
  }

  // Remove ORDER BY, OFFSET, FETCH for count query
  let countSql = sql
    .replace(/ORDER\s+BY[\s\S]+$/i, '')
    .replace(/OFFSET\s+\d+\s+ROWS/i, '')
    .replace(/FETCH\s+NEXT\s+\d+\s+ROWS\s+ONLY/i, '');

  // Replace SELECT columns with COUNT(*)
  countSql = countSql.replace(/SELECT\s+[\s\S]+?\s+FROM/i, 'SELECT COUNT(*) as total FROM');

  return countSql;
}
