export interface DatabaseConnection {
  id: string;
  name: string;
  type: 'sqlserver' | 'postgresql' | 'mysql';
  host: string;
  port: number;
  database: string;
  username: string;
  ssl: boolean;
  timeout: number;
  status: 'connected' | 'disconnected' | 'error';
  createdAt: string;
  lastTested: string | null;
}

export interface TableSchema {
  name: string;
  schema: string;
  columns: ColumnSchema[];
  indexes: IndexSchema[];
  rowCount: number;
}

export interface ColumnSchema {
  name: string;
  dataType: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignKeyTable?: string;
  foreignKeyColumn?: string;
  maxLength?: number;
  defaultValue?: string;
}

export interface IndexSchema {
  name: string;
  columns: string[];
  isUnique: boolean;
  isClustered: boolean;
}

export interface SqlQuery {
  id: string;
  name: string;
  sql: string;
  connectionId: string;
  parameters: QueryParameter[];
  createdAt: string;
  updatedAt: string;
  lastExecuted: string | null;
  executionCount: number;
}

export interface QueryParameter {
  name: string;
  type: 'string' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime';
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface ApiDefinition {
  id: string;
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  sql: string;
  connectionId: string;
  queryId: string;
  parameters: QueryParameter[];
  status: 'draft' | 'published' | 'deprecated' | 'disabled';
  version: string;
  authRequired: boolean;
  rateLimit: number;
  rateLimitWindow: string;
  cacheDuration: number;
  maxRows: number;
  timeout: number;
  pagination: boolean;
  pageSize: number;
  createdAt: string;
  updatedAt: string;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsed: string | null;
  isActive: boolean;
  apis: string[];
  requestCount: number;
}

export interface ApiRequestLog {
  id: string;
  apiId: string;
  apiName: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  parameters: Record<string, unknown>;
  apiKeyId: string | null;
  apiKeyName: string | null;
  ipAddress: string;
  errorMessage: string | null;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

export interface DashboardMetrics {
  connectedDatabases: number;
  publishedApis: number;
  requestsToday: number;
  failedRequests: number;
  avgResponseTime: number;
}
