export interface Api {
    id?: number;
    user_id: number;
    connection_id: number;
    name: string;
    description?: string;
    query: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    parameters?: any;
    is_published?: boolean;
    requires_auth?: boolean;
    rate_limit?: number;
    created_at?: Date;
    updated_at?: Date;
}
export declare class ApiService {
    private pool;
    constructor();
    private getPool;
    createApi(api: Api): Promise<Api>;
    getApiById(id: number, userId: number): Promise<Api | null>;
    getAllApis(userId: number): Promise<Api[]>;
    updateApi(id: number, userId: number, updates: Partial<Api>): Promise<Api | null>;
    deleteApi(id: number, userId: number): Promise<boolean>;
    getApiByEndpoint(endpoint: string): Promise<Api | null>;
}
declare const _default: ApiService;
export default _default;
//# sourceMappingURL=apiService.d.ts.map