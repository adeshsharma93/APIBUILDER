export interface ApiKey {
    id: string;
    project_id: string;
    name: string;
    key_prefix: string;
    allowed_apis: string[];
    expires_at: string | null;
    last_used_at: string | null;
    is_active: boolean;
    request_count: number;
    created_at: string;
}
export interface CreateApiKeyInput {
    project_id: string;
    name: string;
    allowed_apis?: string[];
    expires_at?: string;
    created_by: string;
}
export interface CreateApiKeyResponse {
    apiKey: ApiKey;
    rawKey: string;
}
export declare class ApiKeyService {
    createApiKey(input: CreateApiKeyInput): Promise<CreateApiKeyResponse>;
    getApiKeyById(id: string, projectId: string): Promise<ApiKey | null>;
    getApiKeysByProject(projectId: string): Promise<ApiKey[]>;
    validateApiKey(rawKey: string): Promise<ApiKey | null>;
    updateApiKeyLastUsed(id: string): Promise<void>;
    deleteApiKey(id: string, projectId: string): Promise<boolean>;
    deactivateApiKey(id: string, projectId: string): Promise<boolean>;
    verifyApiKey(rawKey: string): Promise<{
        valid: boolean;
        apiKey?: ApiKey;
    }>;
    hasAccessToApi(apiKeyId: string, apiId: string): Promise<boolean>;
}
declare const _default: ApiKeyService;
export default _default;
//# sourceMappingURL=apiKeyService.d.ts.map