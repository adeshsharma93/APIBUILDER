import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Copy,
  CheckCircle2,
  Clock,
  Activity,
  AlertTriangle,
  Globe,
  Key,
  Settings,
  Code2,
  BookOpen,
  Send,
  Terminal,
} from 'lucide-react';
import { useStore } from '../store/useStore';


export const ApiDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { apis, requestLogs, addToast } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'test' | 'docs' | 'logs' | 'metrics'>('overview');
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<null | { status: number; time: number; data: unknown }>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const api = apis.find((a) => a.id === id);
  if (!api) {
    return (
      <div className="text-center py-16">
        <Globe className="w-16 h-16 text-gray-700 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-400">API not found</h3>
        <Link to="/apis" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
          ← Back to APIs
        </Link>
      </div>
    );
  }

  const apiLogs = requestLogs.filter((l) => l.apiId === api.id);

  const handleTestApi = async () => {
    // Validate required parameters
    const missingParams = api.parameters.filter(p => p.required && !testParams[p.name]);
    if (missingParams.length > 0) {
      addToast('error', `Missing required parameters: ${missingParams.map(p => p.name).join(', ')}`);
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(testParams)) {
        if (value) queryParams.append(key, value);
      }
      
      // Add pagination if enabled
      if (api.pagination) {
        queryParams.append('page', '1');
        queryParams.append('pageSize', String(api.pageSize));
      }
      
      // Get API key from localStorage for testing
      const storedKeys = localStorage.getItem('sql-api-builder-storage');
      let apiKey = '';
      if (storedKeys) {
        try {
          const parsed = JSON.parse(storedKeys);
          const apiKeys = parsed.apiKeys || [];
          const activeKey = apiKeys.find((k: any) => k.isActive);
          if (activeKey) {
            // We need the actual key, not just the prefix
            // For testing, we'll use a demo key or prompt user
            apiKey = activeKey.key || activeKey.fullKey || '';
          }
        } catch (e) {
          console.error('Failed to parse stored keys:', e);
        }
      }
      
      // Make real API call to backend
      const startTime = Date.now();
      const response = await fetch(`http://localhost:3001/api/execute/${api.id}?${queryParams.toString()}`, {
        method: api.method,
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'X-API-Key': apiKey } : {}),
        },
      });
      
      const responseTime = Date.now() - startTime;
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error?.message || `HTTP ${response.status}`);
      }
      
      setTestResult({
        status: response.status,
        time: responseTime,
        data: responseData,
      });
      addToast('success', `Test successful - ${responseTime}ms response time`);
    } catch (error: any) {
      console.error('API test error:', error);
      setTestResult({
        status: 500,
        time: 0,
        data: {
          success: false,
          error: { code: 'TEST_ERROR', message: error.message },
        },
      });
      addToast('error', `Test failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const curlCommand = `curl -X ${api.method} \\
  "https://api.sqlapi.dev${api.endpoint}${api.parameters.length > 0 ? '?' + api.parameters.map(p => `${p.name}=${p.defaultValue || 'value'}`).join('&') : ''}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`;

  const exampleResponse = JSON.stringify({
    success: true,
    data: [
      { id: 1, name: 'Rajesh Kumar', email: 'rajesh@example.com' },
      { id: 2, name: 'Priya Sharma', email: 'priya@example.com' },
    ],
    pagination: {
      page: 1,
      pageSize: 50,
      total: 156,
      totalPages: 4,
    },
  }, null, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/apis" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded ${
              api.method === 'GET' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
            }`}>
              {api.method}
            </span>
            <h1 className="text-xl font-bold text-white">{api.name}</h1>
            <span className={`px-2 py-0.5 text-xs rounded-full border ${
              api.status === 'published' ? 'bg-green-900/50 text-green-400 border-green-800' :
              api.status === 'draft' ? 'bg-yellow-900/50 text-yellow-400 border-yellow-800' :
              'bg-gray-800 text-gray-400 border-gray-700'
            }`}>
              {api.status}
            </span>
            <span className="text-xs text-gray-600">v{api.version}</span>
          </div>
          <code className="text-sm font-mono text-blue-300 mt-1 block">{api.endpoint}</code>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Activity className="w-3 h-3" />
            Total Requests
          </div>
          <p className="text-xl font-bold text-white">{api.requestCount.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <AlertTriangle className="w-3 h-3" />
            Errors
          </div>
          <p className="text-xl font-bold text-white">{api.errorCount}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Clock className="w-3 h-3" />
            Avg Response
          </div>
          <p className="text-xl font-bold text-white">{api.avgResponseTime}ms</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Clock className="w-3 h-3" />
            P95 / P99
          </div>
          <p className="text-xl font-bold text-white">{api.p95ResponseTime}ms / {api.p99ResponseTime}ms</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-800">
        {[
          { id: 'overview', label: 'Overview', icon: Code2 },
          { id: 'test', label: 'Test API', icon: Play },
          { id: 'docs', label: 'Documentation', icon: BookOpen },
          { id: 'logs', label: 'Logs', icon: Activity },
          { id: 'metrics', label: 'Metrics', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SQL */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">SQL Query</h3>
              <button
                onClick={() => handleCopy(api.sql, 'sql')}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
              >
                {copied === 'sql' ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied === 'sql' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-4">
              <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap bg-gray-800/50 rounded-lg p-4 overflow-x-auto">
                {api.sql}
              </pre>
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Parameters</h3>
            </div>
            <div className="p-4">
              {api.parameters.length > 0 ? (
                <div className="space-y-3">
                  {api.parameters.map((param) => (
                    <div key={param.name} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <span className="font-mono text-sm text-white">{param.name}</span>
                        {param.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{param.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded">
                          {param.type}
                        </span>
                        {param.required && (
                          <span className="text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded">
                            required
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No parameters</p>
              )}
            </div>

            {/* Configuration */}
            <div className="p-4 border-t border-gray-800">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Configuration</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-xs">
                  <span className="text-gray-500">Rate Limit:</span>
                  <span className="text-white ml-2">{api.rateLimit} req/{api.rateLimitWindow}</span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-500">Cache:</span>
                  <span className="text-white ml-2">{api.cacheDuration}s</span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-500">Max Rows:</span>
                  <span className="text-white ml-2">{api.maxRows}</span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-500">Timeout:</span>
                  <span className="text-white ml-2">{api.timeout}s</span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-500">Pagination:</span>
                  <span className="text-white ml-2">{api.pagination ? `Enabled (${api.pageSize}/page)` : 'Disabled'}</span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-500">Auth:</span>
                  <span className="text-white ml-2">{api.authRequired ? 'API Key' : 'None'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* cURL Example */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-white">Example Request</h3>
              </div>
              <button
                onClick={() => handleCopy(curlCommand, 'curl')}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
              >
                {copied === 'curl' ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied === 'curl' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-4">
              <pre className="text-xs font-mono text-green-300 whitespace-pre-wrap bg-gray-800/50 rounded-lg p-4">
                {curlCommand}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'test' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test form */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Test Request</h3>
              <p className="text-xs text-gray-500 mt-1">Send a test request to this API</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Endpoint</label>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs font-mono rounded">{api.method}</span>
                  <code className="text-sm font-mono text-white">{api.endpoint}</code>
                </div>
              </div>

              {/* Request URL Preview */}
              {Object.keys(testParams).length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Request URL</label>
                  <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs font-mono text-blue-300 break-all">
                    https://api.sqlapi.dev{api.endpoint}
                    {Object.entries(testParams).filter(([_, v]) => v).length > 0 && (
                      <>?{Object.entries(testParams).filter(([_, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}</>
                    )}
                  </div>
                </div>
              )}

              {api.parameters.map((param) => (
                <div key={param.name}>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    {param.name}
                    <span className="text-gray-600 ml-1">({param.type})</span>
                    {param.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    value={testParams[param.name] || ''}
                    onChange={(e) => setTestParams({ ...testParams, [param.name]: e.target.value })}
                    placeholder={param.defaultValue || `Enter ${param.name}...`}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {param.description && (
                    <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                  )}
                </div>
              ))}

              {api.pagination && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Page</label>
                    <input
                      type="number"
                      value={testParams['page'] || '1'}
                      onChange={(e) => setTestParams({ ...testParams, page: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Page Size</label>
                    <input
                      type="number"
                      value={testParams['pageSize'] || api.pageSize.toString()}
                      onChange={(e) => setTestParams({ ...testParams, pageSize: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">API Key</label>
                <input
                  type="text"
                  placeholder="sk_live_..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
              <button
                onClick={handleTestApi}
                disabled={isTesting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isTesting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isTesting ? 'Sending Request...' : 'Send Request'}
              </button>
            </div>
          </div>

          {/* Test result */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Response</h3>
            </div>
            <div className="p-4">
              {testResult ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className="text-green-400 font-mono">{testResult.status}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="text-gray-500">Time:</span>
                      <span className="text-white font-mono">{testResult.time}ms</span>
                    </span>
                  </div>
                  <pre className="text-xs font-mono text-gray-300 bg-[#0d1117] border border-gray-700 rounded-lg p-4 overflow-auto" style={{ height: '300px' }}>
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Send className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Send a request to see the response</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-2">{api.name}</h2>
            <p className="text-gray-400 text-sm mb-6">{api.description}</p>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Endpoint</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-mono font-bold rounded ${
                    api.method === 'GET' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
                  }`}>{api.method}</span>
                  <code className="text-sm font-mono text-blue-300 bg-gray-800 px-3 py-1.5 rounded">
                    https://api.sqlapi.dev{api.endpoint}
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Authentication</h3>
                <p className="text-sm text-gray-400">
                  {api.authRequired ? (
                    <>This endpoint requires an API key. Include it in the Authorization header:</>
                  ) : (
                    'No authentication required.'
                  )}
                </p>
                {api.authRequired && (
                  <pre className="mt-2 text-xs font-mono text-gray-300 bg-gray-800 rounded-lg p-3">
                    Authorization: Bearer YOUR_API_KEY
                  </pre>
                )}
              </div>

              {api.parameters.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">Query Parameters</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Name</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Type</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Required</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {api.parameters.map((param) => (
                        <tr key={param.name} className="border-b border-gray-800/50">
                          <td className="py-2 px-3 font-mono text-xs text-white">{param.name}</td>
                          <td className="py-2 px-3 text-xs text-blue-400">{param.type}</td>
                          <td className="py-2 px-3 text-xs text-gray-400">{param.required ? 'Yes' : 'No'}</td>
                          <td className="py-2 px-3 text-xs text-gray-400">{param.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Example Response</h3>
                <pre className="text-xs font-mono text-gray-300 bg-gray-800 rounded-lg p-4 overflow-x-auto">
                  {exampleResponse}
                </pre>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Error Responses</h3>
                <div className="space-y-2">
                  {[
                    { code: 400, message: 'INVALID_PARAMETER', desc: 'A required parameter is missing or has an invalid type.' },
                    { code: 401, message: 'UNAUTHORIZED', desc: 'Missing or invalid API key.' },
                    { code: 429, message: 'RATE_LIMIT_EXCEEDED', desc: 'Too many requests.' },
                    { code: 504, message: 'QUERY_TIMEOUT', desc: 'The database query exceeded the configured timeout.' },
                  ].map((err) => (
                    <div key={err.code} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-xs font-mono text-red-400 bg-red-900/30 px-2 py-0.5 rounded">{err.code}</span>
                      <div>
                        <span className="text-xs font-mono text-white">{err.message}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{err.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">Request Logs ({apiLogs.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-xs">Time</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-xs">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-xs">Response Time</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-xs">Parameters</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-xs">API Key</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-xs">IP</th>
                </tr>
              </thead>
              <tbody>
                {apiLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-xs text-gray-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-mono ${
                        log.statusCode < 300 ? 'text-green-400' :
                        log.statusCode < 400 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-300">{log.responseTime}ms</td>
                    <td className="py-3 px-4">
                      <code className="text-xs text-gray-400 font-mono">
                        {JSON.stringify(log.parameters).slice(0, 50)}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400">{log.apiKeyName || '-'}</td>
                    <td className="py-3 px-4 text-xs text-gray-500 font-mono">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Response Time Distribution</h3>
            <div className="space-y-3">
              {[
                { label: 'Average', value: api.avgResponseTime, max: 200 },
                { label: 'P50', value: Math.round(api.avgResponseTime * 0.8), max: 200 },
                { label: 'P95', value: api.p95ResponseTime, max: 200 },
                { label: 'P99', value: api.p99ResponseTime, max: 200 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-12">{item.label}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-white font-mono w-12 text-right">{item.value}ms</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Error Rate</h3>
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  {api.requestCount > 0 ? ((api.errorCount / api.requestCount) * 100).toFixed(2) : '0.00'}%
                </p>
                <p className="text-xs text-gray-500 mt-1">{api.errorCount} errors / {api.requestCount.toLocaleString()} requests</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
