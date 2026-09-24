export interface DatabaseConnection {
    id: string;
    project_id: string;
    name: string;
    type: 'mysql' | 'sqlserver' | 'postgresql';
    host: string;
    port: number;
    database_name: string;
    username: string;
    encrypted_password?: string;
    ssl_enabled: boolean;
    connection_timeout: number;
    status: string;
    last_tested_at: string | null;
    created_at: string;
    updated_at: string;
}
export interface CreateConnectionInput {
    project_id: string;
    name: string;
    type: 'mysql' | 'sqlserver' | 'postgresql';
    host: string;
    port: number;
    database_name: string;
    username: string;
    password: string;
    ssl_enabled: boolean;
    connection_timeout: number;
}
export declare class DatabaseConnectionService {
    /**
     * Create a new database connection
     */
    createConnection(input: CreateConnectionInput): Promise<DatabaseConnection>;
    /**
     * Get all connections for a project
     */
    getConnections(projectId: string, type?: 'mysql' | 'sqlserver'): Promise<DatabaseConnection[]>;
    /**
     * Get a single connection by ID
     */
    getConnection(id: string, type?: 'mysql' | 'sqlserver'): Promise<DatabaseConnection | null>;
    /**
     * Test a database connection
     */
    testConnection(id: string, type?: 'mysql' | 'sqlserver'): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Delete a connection
     */
    deleteConnection(id: string, type?: 'mysql' | 'sqlserver'): Promise<void>;
    /**
     * Get user database pool (for executing queries)
     */
    getUserDbPool(connectionId: string, type?: 'mysql' | 'sqlserver'): Promise<import("mysql2/promise").Pool | {
        type: "mysql" | "sqlserver" | "postgresql";
        pool: import("mysql2/promise").Pool | import("mssql").ConnectionPool;
        mysqlPool?: import("mysql2/promise").Pool;
        mssqlPool?: import("mssql").ConnectionPool;
    }>;
}
export declare const databaseConnectionService: DatabaseConnectionService;
//# sourceMappingURL=databaseConnectionService.d.ts.map