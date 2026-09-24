export interface Connection {
    id?: string;
    project_id: string;
    name: string;
    type: 'mysql' | 'sqlserver' | 'postgresql';
    host: string;
    port: number;
    database_name: string;
    username: string;
    password_encrypted: string;
    ssl_enabled?: boolean;
    connection_timeout?: number;
    status?: 'connected' | 'disconnected' | 'error';
    last_tested_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}
export declare class ConnectionService {
    private pool;
    constructor();
    private getPool;
    createConnection(connection: Connection): Promise<Connection>;
    getConnectionById(id: string, projectId: string): Promise<Connection | null>;
    getAllConnections(projectId: string): Promise<Connection[]>;
    updateConnection(id: string, projectId: string, updates: Partial<Connection>): Promise<Connection | null>;
    deleteConnection(id: string, projectId: string): Promise<boolean>;
}
declare const _default: ConnectionService;
export default _default;
//# sourceMappingURL=connectionService.d.ts.map