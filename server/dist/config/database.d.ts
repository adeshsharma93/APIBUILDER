import { ConnectionPool } from 'mssql';
import mysql from 'mysql2/promise';
export declare const appDbConfig: mysql.PoolOptions;
export declare function getAppDbPool(): Promise<mysql.Pool>;
export interface UserConnection {
    id: string;
    name: string;
    host: string;
    port: number;
    database_name: string;
    username: string;
    encrypted_password: string;
    ssl_enabled: boolean;
    type: 'mysql' | 'sqlserver' | 'postgresql';
}
export declare function getUserDbPool(connectionId: string): Promise<{
    type: 'mysql' | 'sqlserver' | 'postgresql';
    pool: mysql.Pool | ConnectionPool;
    mysqlPool?: mysql.Pool;
    mssqlPool?: ConnectionPool;
}>;
export declare function testConnection(config: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    type: 'mysql' | 'sqlserver' | 'postgresql';
}): Promise<boolean>;
//# sourceMappingURL=database.d.ts.map