import mysql, { Pool, ConnectionOptions } from 'mysql2/promise';
export declare const mysqlAppDbConfig: ConnectionOptions;
export declare function getMysqlPool(): Promise<Pool>;
/**
 * Remove and close a user database connection pool
 * Call this when a connection is deleted or credentials change
 */
export declare function removeUserMysqlPool(connectionId: string): void;
/**
 * Clear all cached connection pools
 * Useful for cleanup or testing
 */
export declare function clearAllUserPools(): Promise<void>;
export declare function getUserMysqlPool(connectionId: string): Promise<mysql.Pool>;
export declare function testMysqlConnection(config: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
}): Promise<boolean>;
//# sourceMappingURL=mysqlDatabase.d.ts.map