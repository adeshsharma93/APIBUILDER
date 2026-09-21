import React, { useState } from 'react';
import {
  BookOpen,
  Globe,
  Copy,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Shield,
  Code2,
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const Documentation: React.FC = () => {
  const { apis } = useStore();
  const [selectedApi, setSelectedApi] = useState(apis[0]?.id || '');
  const [copied, setCopied] = useState<string | null>(null);
  const publishedApis = apis.filter((a) => a.status === 'published');
  const selectedApiDef = apis.find((a) => a.id === selectedApi);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateOpenApiSpec = () => {
    return {
      openapi: '3.0.3',
      info: {
        title: 'SQL API Builder - Generated APIs',
        version: '1.0.0',
        description: 'Auto-generated API documentation for all published endpoints.',
      },
      servers: [{ url: 'https://api.sqlapi.dev', description: 'Production' }],
      paths: Object.fromEntries(
        publishedApis.map((api) => [
          api.endpoint,
          {
            [api.method.toLowerCase()]: {
              summary: api.name,
              description: api.description,
              parameters: api.parameters.map((p) => ({
                name: p.name,
                in: 'query',
                required: p.required,
                schema: { type: p.type === 'integer' ? 'integer' : 'string' },
                description: p.description,
              })),
              security: api.authRequired ? [{ bearerAuth: [] }] : [],
              responses: {
                '200': { description: 'Successful response' },
                '400': { description: 'Invalid parameter' },
                '401': { description: 'Unauthorized' },
                '429': { description: 'Rate limit exceeded' },
              },
            },
          },
        ])
      ),
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer' },
        },
      },
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Documentation</h1>
          <p className="text-gray-400 mt-1">Interactive OpenAPI documentation for your APIs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(JSON.stringify(generateOpenApiSpec(), null, 2), 'openapi')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {copied === 'openapi' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Code2 className="w-4 h-4" />}
            {copied === 'openapi' ? 'Copied!' : 'Export OpenAPI'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* API List */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              Endpoints ({publishedApis.length})
            </h3>
          </div>
          <div className="p-2 space-y-1">
            {publishedApis.map((api) => (
              <button
                key={api.id}
                onClick={() => setSelectedApi(api.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                  selectedApi === api.id
                    ? 'bg-blue-900/30 border border-blue-500/30'
                    : 'hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded ${
                    api.method === 'GET' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
                  }`}>
                    {api.method}
                  </span>
                  <span className="text-xs text-white truncate">{api.name}</span>
                </div>
                <p className="text-[10px] text-gray-500 font-mono mt-1 ml-8">{api.endpoint}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Documentation Content */}
        <div className="lg:col-span-3 space-y-6">
          {selectedApiDef ? (
            <>
              {/* API Header */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 text-sm font-mono font-bold rounded ${
                    selectedApiDef.method === 'GET' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
                  }`}>
                    {selectedApiDef.method}
                  </span>
                  <h2 className="text-lg font-bold text-white">{selectedApiDef.name}</h2>
                </div>
                <p className="text-sm text-gray-400 mb-4">{selectedApiDef.description}</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-blue-300 bg-gray-800 px-4 py-2 rounded-lg flex-1">
                    https://api.sqlapi.dev{selectedApiDef.endpoint}
                  </code>
                  <button
                    onClick={() => handleCopy(`https://api.sqlapi.dev${selectedApiDef.endpoint}`, 'url')}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {copied === 'url' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>

              {/* Authentication */}
              {selectedApiDef.authRequired && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-amber-400" />
                    Authentication
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    This endpoint requires a valid API key passed in the Authorization header.
                  </p>
                  <pre className="text-xs font-mono text-gray-300 bg-gray-800 rounded-lg p-4">
                    {`Authorization: Bearer YOUR_API_KEY`}
                  </pre>
                </div>
              )}

              {/* Parameters */}
              {selectedApiDef.parameters.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-4">Query Parameters</h3>
                  <div className="space-y-3">
                    {selectedApiDef.parameters.map((param) => (
                      <div key={param.name} className="p-4 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3 mb-1">
                          <code className="text-sm font-mono text-white">{param.name}</code>
                          <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded">{param.type}</span>
                          {param.required && (
                            <span className="text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded">required</span>
                          )}
                        </div>
                        {param.description && (
                          <p className="text-xs text-gray-400 mt-1">{param.description}</p>
                        )}
                        {param.defaultValue && (
                          <p className="text-xs text-gray-500 mt-1">Default: <code className="text-gray-300">{param.defaultValue}</code></p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {selectedApiDef.pagination && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-3">Pagination</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    This endpoint supports pagination with the following query parameters:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <code className="text-xs font-mono text-white">page</code>
                      <p className="text-xs text-gray-500 mt-1">Page number (default: 1)</p>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <code className="text-xs font-mono text-white">pageSize</code>
                      <p className="text-xs text-gray-500 mt-1">Items per page (default: {selectedApiDef.pageSize})</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Example Request */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Example Request</h3>
                  <button
                    onClick={() => handleCopy(
                      `curl -X ${selectedApiDef.method} "https://api.sqlapi.dev${selectedApiDef.endpoint}${selectedApiDef.parameters.length > 0 ? '?' + selectedApiDef.parameters.map(p => `${p.name}=${p.defaultValue || 'value'}`).join('&') : ''}" -H "Authorization: Bearer YOUR_API_KEY"`,
                      'curl'
                    )}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                  >
                    {copied === 'curl' ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied === 'curl' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="text-xs font-mono text-green-300 bg-gray-800 rounded-lg p-4 overflow-x-auto">
                  {`curl -X ${selectedApiDef.method} \\\n  "https://api.sqlapi.dev${selectedApiDef.endpoint}${selectedApiDef.parameters.length > 0 ? '?' + selectedApiDef.parameters.map(p => `${p.name}=${p.defaultValue || 'value'}`).join('&') : ''}" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json"`}
                </pre>
              </div>

              {/* Example Response */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-3">Example Response</h3>
                <pre className="text-xs font-mono text-gray-300 bg-gray-800 rounded-lg p-4 overflow-x-auto">
                  {JSON.stringify({
                    success: true,
                    data: [{ id: 1, name: 'Example', email: 'example@test.com' }],
                    pagination: selectedApiDef.pagination ? {
                      page: 1,
                      pageSize: selectedApiDef.pageSize,
                      total: 156,
                      totalPages: 4,
                    } : undefined,
                  }, null, 2)}
                </pre>
              </div>

              {/* Error Responses */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Error Responses</h3>
                <div className="space-y-2">
                  {[
                    { code: 400, name: 'INVALID_PARAMETER', example: { success: false, error: { code: 'INVALID_PARAMETER', message: 'country must be a string.' } } },
                    { code: 401, name: 'UNAUTHORIZED', example: { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key.' } } },
                    { code: 429, name: 'RATE_LIMIT_EXCEEDED', example: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests.' } } },
                    { code: 504, name: 'QUERY_TIMEOUT', example: { success: false, error: { code: 'QUERY_TIMEOUT', message: 'The database query exceeded the configured timeout.' } } },
                  ].map((err) => (
                    <div key={err.code} className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-red-400 bg-red-900/30 px-2 py-0.5 rounded">{err.code}</span>
                        <span className="text-xs font-mono text-white">{err.name}</span>
                      </div>
                      <pre className="text-[10px] font-mono text-gray-400">
                        {JSON.stringify(err.example, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
              <BookOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400">No published APIs</h3>
              <p className="text-sm text-gray-600 mt-1">Publish an API to generate documentation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
