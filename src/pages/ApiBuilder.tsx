import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SqlEditorComponent } from '../components/SqlEditor';
import {
  ArrowLeft,
  Save,
  Play,
  Globe,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Database,
  Clock,
  Rows,
  TestTube,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { QueryParameter } from '../types';

export const ApiBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { addApi, addToast, apis, connections } = useStore();
  const [step, setStep] = useState(1);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isQueryRunning, setIsQueryRunning] = useState(false);

  // Check if SQL was passed from SQL Editor
  const initialSql = localStorage.getItem('sql-api-builder-new-api-sql') || `SELECT
    CustomerId,
    CustomerName,
    Email,
    Phone,
    City,
    CreatedAt
FROM dbo.Customers
WHERE Country = @country
  AND IsActive = 1
ORDER BY CreatedAt DESC
OFFSET @offset ROWS
FETCH NEXT @pageSize ROWS ONLY;`;

  const initialName = localStorage.getItem('sql-api-builder-new-api-name') || '';

  // Clear the stored SQL after reading it
  React.useEffect(() => {
    localStorage.removeItem('sql-api-builder-new-api-sql');
    localStorage.removeItem('sql-api-builder-new-api-name');
  }, []);

  const [form, setForm] = useState({
    name: initialName,
    endpoint: '',
    method: 'GET' as 'GET' | 'POST' | 'PUT' | 'DELETE',
    description: '',
    sql: initialSql,
    connectionId: connections[0]?.id || '',
    authRequired: true,
    rateLimit: 100,
    rateLimitWindow: '1m',
    cacheDuration: 60,
    maxRows: 1000,
    timeout: 30,
    pagination: true,
    pageSize: 50,
    version: '1.0.0',
    status: 'draft' as 'draft' | 'published',
  });

  const [parameters, setParameters] = useState<QueryParameter[]>([]);

  // Auto-detect parameters from SQL
  useEffect(() => {
    const paramRegex = /@(\w+)/g;
    const detected: string[] = [];
    let match;
    while ((match = paramRegex.exec(form.sql)) !== null) {
      if (!detected.includes(match[1]) && !['offset', 'pageSize'].includes(match[1])) {
        detected.push(match[1]);
      }
    }

    setParameters((prev) => {
      const existing = prev.filter((p) => detected.includes(p.name));
      const newParams = detected
        .filter((name) => !prev.find((p) => p.name === name))
        .map((name) => ({
          name,
          type: 'string' as const,
          required: true,
          description: '',
        }));
      return [...existing, ...newParams];
    });
  }, [form.sql]);

  // Auto-generate endpoint from name
  const generateEndpoint = (name: string) => {
    if (!name) return '';
    return '/api/v1/' + name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  };

  // Validate endpoint is unique
  const isEndpointUnique = (endpoint: string, currentApiId?: string) => {
    return !apis.some(api => 
      api.endpoint === endpoint && 
      api.version === form.version &&
      api.id !== currentApiId
    );
  };

  // Test API functionality
  const handleTestApi = async () => {
    // Validate required parameters
    const missingParams = parameters.filter(p => p.required && !testParams[p.name]);
    if (missingParams.length > 0) {
      addToast('error', `Missing required parameters: ${missingParams.map(p => p.name).join(', ')}`);
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    // Generate mock response based on SQL
    const mockData = [
      { id: 1, name: 'Sample Record 1', created_at: new Date().toISOString() },
      { id: 2, name: 'Sample Record 2', created_at: new Date().toISOString() },
      { id: 3, name: 'Sample Record 3', created_at: new Date().toISOString() },
    ];

    const responseTime = Math.floor(50 + Math.random() * 150);

    setTestResult({
      status: 200,
      time: responseTime,
      data: {
        success: true,
        data: mockData,
        pagination: form.pagination ? {
          page: 1,
          pageSize: form.pageSize,
          total: 156,
          totalPages: Math.ceil(156 / form.pageSize),
        } : undefined,
        metadata: {
          executionTime: responseTime,
          rowCount: mockData.length,
          cached: false,
        }
      }
    });

    setIsTesting(false);
    addToast('success', `API test successful - ${responseTime}ms response time`);
  };

  const handleSave = (publish: boolean = false) => {
    if (!form.name || !form.sql) {
      addToast('error', 'Please fill in all required fields');
      return;
    }

    // Auto-generate endpoint if not provided
    let endpoint = form.endpoint;
    if (!endpoint) {
      endpoint = generateEndpoint(form.name);
      if (!endpoint) {
        addToast('error', 'Please provide an API name or endpoint');
        return;
      }
    }

    // Ensure endpoint starts with /
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }

    // Check for duplicate endpoints
    if (!isEndpointUnique(endpoint)) {
      addToast('error', `An API with endpoint "${endpoint}" already exists for version ${form.version}`);
      return;
    }

    addApi({
      id: `api-${Date.now()}`,
      name: form.name,
      endpoint: endpoint,
      method: form.method,
      description: form.description,
      sql: form.sql,
      connectionId: form.connectionId,
      queryId: `query-${Date.now()}`,
      parameters,
      status: publish ? 'published' : 'draft',
      version: form.version,
      authRequired: form.authRequired,
      rateLimit: form.rateLimit,
      rateLimitWindow: form.rateLimitWindow,
      cacheDuration: form.cacheDuration,
      maxRows: form.maxRows,
      timeout: form.timeout,
      pagination: form.pagination,
      pageSize: form.pageSize,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requestCount: 0,
      errorCount: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
    });

    addToast('success', publish ? 'API published successfully!' : 'API saved as draft');
    navigate('/apis');
  };

  const updateParameter = (index: number, field: keyof QueryParameter, value: unknown) => {
    setParameters((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const removeParameter = (index: number) => {
    setParameters((prev) => prev.filter((_, i) => i !== index));
  };

  // Test query execution against selected database
  const handleTestQuery = async () => {
    if (!form.sql.trim()) {
      addToast('error', 'Please write a SQL query first');
      return;
    }

    if (!form.connectionId) {
      addToast('error', 'Please select a database connection');
      return;
    }

    setIsQueryRunning(true);
    setQueryResult(null);

    try {
      // Get the selected connection to determine database type
      const selectedConnection = connections.find((c: any) => c.id === form.connectionId);
      const dbType = selectedConnection?.type || 'mysql';

      // Call backend API to execute the query
      const response = await fetch('http://localhost:3001/api/query/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId: form.connectionId,
          sql: form.sql,
          parameters: {},
          dbType: dbType,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setQueryResult({
          columns: data.data.columns,
          rows: data.data.rows.slice(0, 5), // Show first 5 rows
          rowCount: data.data.rowCount,
          executionTime: data.data.executionTime,
          connectionName: data.data.connectionName,
        });

        addToast('success', `Query executed successfully - ${data.data.executionTime}ms, ${data.data.rowCount} rows`);
      } else {
        throw new Error(data.error?.message || 'Query execution failed');
      }
    } catch (error: any) {
      console.error('Error testing query:', error);
      addToast('error', error.message || 'Failed to execute query');
    } finally {
      setIsQueryRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/apis')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Create API</h1>
          <p className="text-sm text-gray-400">Define a new REST API endpoint from a SQL query</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave(false)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Globe className="w-4 h-4" />
            Publish API
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {[
          { num: 1, label: 'SQL Query' },
          { num: 2, label: 'Parameters' },
          { num: 3, label: 'Configuration' },
          { num: 4, label: 'Review' },
        ].map((s, i) => (
          <React.Fragment key={s.num}>
            <button
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                step === s.num
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : step > s.num
                  ? 'bg-green-900/30 text-green-400'
                  : 'text-gray-500 hover:text-white hover:bg-gray-800'
              }`}
            >
              {step > s.num ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">
                  {s.num}
                </span>
              )}
              {s.label}
            </button>
            {i < 3 && <div className="w-4 h-px bg-gray-700" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              {/* Database Connection Selector */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                  <Database className="w-4 h-4 text-blue-400" />
                  Database Connection
                </label>
                <select
                  value={form.connectionId}
                  onChange={(e) => setForm({ ...form, connectionId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a database connection...</option>
                  {connections.map((conn: any) => (
                    <option key={conn.id} value={conn.id} disabled={conn.status !== 'connected'}>
                      {conn.name} ({conn.database}) - {conn.type.toUpperCase()} {conn.status !== 'connected' ? '⚠️ Disconnected' : '✅'}
                    </option>
                  ))}
                </select>
                {connections.length === 0 && (
                  <p className="text-xs text-amber-400 mt-2">
                    No database connections found. Please create one in the Database Connections page.
                  </p>
                )}
              </div>

              {/* SQL Query Editor */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">SQL Query</h3>
                    <p className="text-xs text-gray-500 mt-1">Write the SQL query for this API. Use @paramName for parameters.</p>
                  </div>
                  <button
                    onClick={handleTestQuery}
                    disabled={isQueryRunning || !form.connectionId}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    {isQueryRunning ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-3.5 h-3.5" />
                        Test Query
                      </>
                    )}
                  </button>
                </div>
                <div className="h-[350px]">
                  <SqlEditorComponent
                    value={form.sql}
                    onChange={(value) => setForm({ ...form, sql: value })}
                    height="100%"
                  />
                </div>
                <div className="p-4 border-t border-gray-800">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Only SELECT statements are allowed for public APIs. Use parameterized queries (@paramName).</span>
                  </div>
                </div>
              </div>

              {/* Query Results Preview */}
              {queryResult && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-sm font-semibold text-white">Query Results</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Rows className="w-3 h-3" />
                          {queryResult.rowCount} rows
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {queryResult.executionTime}ms
                        </span>
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Success
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      Connected to: <span className="text-blue-400">{queryResult.connectionName}</span>
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-800">
                        <tr>
                          {queryResult.columns.map((col: string) => (
                            <th key={col} className="text-left py-2 px-3 text-gray-400 font-medium whitespace-nowrap border-b border-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.rows.map((row: any[], rowIndex: number) => (
                          <tr key={rowIndex} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                            {row.map((cell: any, cellIndex: number) => (
                              <td key={cellIndex} className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">
                                {cell === null ? <span className="text-gray-600 italic">NULL</span> : String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-3 border-t border-gray-800 bg-gray-800/30">
                    <p className="text-xs text-gray-500">
                      Showing first {queryResult.rows.length} of {queryResult.rowCount} rows. Results are from the selected database connection.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-white">Parameters</h3>
                <p className="text-xs text-gray-500 mt-1">Configure the detected parameters from your SQL query.</p>
              </div>
              <div className="p-4 space-y-3">
                {parameters.length > 0 ? (
                  parameters.map((param, index) => (
                    <div key={param.name} className="p-4 bg-gray-800/50 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono text-blue-300">@{param.name}</code>
                        <button
                          onClick={() => removeParameter(index)}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Type</label>
                          <select
                            value={param.type}
                            onChange={(e) => updateParameter(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="string">string</option>
                            <option value="integer">integer</option>
                            <option value="decimal">decimal</option>
                            <option value="boolean">boolean</option>
                            <option value="date">date</option>
                            <option value="datetime">datetime</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Required</label>
                          <select
                            value={param.required ? 'true' : 'false'}
                            onChange={(e) => updateParameter(index, 'required', e.target.value === 'true')}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="true">Required</option>
                            <option value="false">Optional</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Description</label>
                        <input
                          type="text"
                          value={param.description || ''}
                          onChange={(e) => updateParameter(index, 'description', e.target.value)}
                          placeholder="Parameter description..."
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Default Value</label>
                        <input
                          type="text"
                          value={param.defaultValue || ''}
                          onChange={(e) => updateParameter(index, 'defaultValue', e.target.value)}
                          placeholder="Optional default value..."
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No parameters detected in SQL query</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
              <h3 className="text-sm font-semibold text-white">API Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Rate Limit (req/min)</label>
                  <input
                    type="number"
                    value={form.rateLimit}
                    onChange={(e) => setForm({ ...form, rateLimit: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Cache Duration (seconds)</label>
                  <input
                    type="number"
                    value={form.cacheDuration}
                    onChange={(e) => setForm({ ...form, cacheDuration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Max Rows</label>
                  <input
                    type="number"
                    value={form.maxRows}
                    onChange={(e) => setForm({ ...form, maxRows: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Timeout (seconds)</label>
                  <input
                    type="number"
                    value={form.timeout}
                    onChange={(e) => setForm({ ...form, timeout: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Page Size</label>
                  <input
                    type="number"
                    value={form.pageSize}
                    onChange={(e) => setForm({ ...form, pageSize: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">Enable Pagination</p>
                  <p className="text-xs text-gray-500 mt-0.5">Automatically paginate results</p>
                </div>
                <button
                  onClick={() => setForm({ ...form, pagination: !form.pagination })}
                  className={`w-10 h-6 rounded-full relative transition-colors ${form.pagination ? 'bg-blue-600' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${form.pagination ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">Require Authentication</p>
                  <p className="text-xs text-gray-500 mt-0.5">API key required to access this endpoint</p>
                </div>
                <button
                  onClick={() => setForm({ ...form, authRequired: !form.authRequired })}
                  className={`w-10 h-6 rounded-full relative transition-colors ${form.authRequired ? 'bg-blue-600' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${form.authRequired ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">Review & Publish</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-xs text-gray-400">Name</span>
                  <span className="text-sm text-white">{form.name || '-'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-xs text-gray-400">Endpoint</span>
                  <code className="text-xs font-mono text-blue-300">{form.method} {form.endpoint || '-'}</code>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-xs text-gray-400">Parameters</span>
                  <span className="text-sm text-white">{parameters.length} detected</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-xs text-gray-400">Authentication</span>
                  <span className="text-sm text-white">{form.authRequired ? 'API Key Required' : 'None'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-xs text-gray-400">Rate Limit</span>
                  <span className="text-sm text-white">{form.rateLimit} req/min</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-xs text-gray-400">Cache</span>
                  <span className="text-sm text-white">{form.cacheDuration}s</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-xs text-gray-400">Pagination</span>
                  <span className="text-sm text-white">{form.pagination ? `Enabled (${form.pageSize}/page)` : 'Disabled'}</span>
                </div>
              </div>

              {/* Generated cURL */}
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">Generated Endpoint:</p>
                <pre className="text-xs font-mono text-green-300 bg-gray-800 rounded-lg p-4">
                  {`curl -X ${form.method} "https://api.sqlapi.dev${form.endpoint}${parameters.length > 0 ? '?' + parameters.map(p => `${p.name}=value`).join('&') : ''}" -H "Authorization: Bearer YOUR_API_KEY"`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Basic Info */}
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">API Details</h3>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">API Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Get Customers by Country"
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what this API does..."
                rows={3}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">HTTP Method</label>
                <select
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE' })}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Version</label>
                <input
                  type="text"
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Endpoint *</label>
              <div className="flex items-center">
                <span className="px-3 py-2.5 bg-gray-700 border border-r-0 border-gray-700 rounded-l-lg text-xs text-gray-400">
                  /api/v1
                </span>
                <input
                  type="text"
                  value={form.endpoint}
                  onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                  placeholder="/customers"
                  className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-r-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Database Connection</label>
              <select
                value={form.connectionId}
                onChange={(e) => setForm({ ...form, connectionId: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {connections.filter((c: any) => c.status === 'connected').map((conn: any) => (
                  <option key={conn.id} value={conn.id}>{conn.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Workflow Progress */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-3">Publishing Workflow</h3>
            <div className="space-y-2">
              {[
                { label: 'Draft SQL', done: form.sql.length > 0 },
                { label: 'Configure Parameters', done: parameters.length > 0 },
                { label: 'Set Configuration', done: step >= 3 },
                { label: 'Review & Publish', done: step >= 4 },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600" />
                  )}
                  <span className={`text-xs ${item.done ? 'text-white' : 'text-gray-500'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
