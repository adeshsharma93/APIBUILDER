import React, { useState, useEffect } from 'react';
import {
  Database,
  ChevronRight,
  ChevronDown,
  Table2,
  Columns,
  Key,
  Link2,
  Search,
  Copy,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { TableSchema, ColumnSchema } from '../types';
import { useStore } from '../store/useStore';
import { fetchWithTimeout } from '../utils/apiClient';

export const DatabaseExplorer: React.FC = () => {
  const { connections, addToast } = useStore();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>(connections[0]?.id || '');
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set(['dbo']));
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [selectedTable, setSelectedTable] = useState<TableSchema | null>(null);
  const [activeTab, setActiveTab] = useState<'columns' | 'indexes' | 'preview'>('columns');
  const [searchTerm, setSearchTerm] = useState('');
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedConnection = connections.find(c => c.id === selectedConnectionId);

  // Fetch tables when connection changes
  useEffect(() => {
    if (selectedConnectionId && selectedConnection?.status === 'connected') {
      fetchTables();
    } else {
      setTables([]);
      if (selectedConnectionId && selectedConnection && selectedConnection.status !== 'connected') {
        setError(`Connection status: ${selectedConnection.status}. Please test the connection first.`);
      } else {
        setError(null);
      }
    }
  }, [selectedConnectionId, selectedConnection?.status]);

  const fetchTables = async () => {
    if (!selectedConnectionId) {
      setError('No connection selected');
      return;
    }

    if (!selectedConnection) {
      setError('Connection not found');
      return;
    }

    if (selectedConnection.status !== 'connected') {
      setError(`Connection status: ${selectedConnection.status}. Please test the connection first.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if this is the demo connection
      const isDemoConnection = selectedConnectionId === 'conn-demo';

      if (isDemoConnection) {
        // Use mock data for demo connection
        await new Promise(resolve => setTimeout(resolve, 500));
        const { mockTables } = await import('../data/mockData');
        setTables(mockTables);
        addToast('success', `Loaded ${mockTables.length} tables from demo database`);
      } else {
        // Check if backend is running
        try {
          const healthCheck = await fetchWithTimeout('http://localhost:3001/health', {}, 5000);
          if (!healthCheck.ok) {
            throw new Error('Backend server is not responding');
          }
        } catch (healthErr: any) {
          if (healthErr.message.includes('timeout')) {
            throw new Error('Backend server is not responding (timeout). Please check if it is running.');
          }
          throw new Error('Backend server is not running. Please start it with: cd server && npm run dev');
        }

        // Fetch real schema from backend API for production connections
        const apiUrl = `http://localhost:3001/api/schema/tables/${selectedConnectionId}?dbType=${selectedConnection.type}`;
        console.log('Fetching schema from:', apiUrl);
        
        const response = await fetchWithTimeout(apiUrl, {}, 30000);
        
        if (!response.ok) {
          let errorMessage = 'Failed to fetch schema';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorMessage;
          } catch {
            errorMessage = `Server error: ${response.statusText}`;
          }
          console.error('API Error Response:', errorMessage);
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('Schema API Response:', data);
        
        if (data.success) {
          // Extract tables array from response (data.data.tables)
          const tablesArray = data.data?.tables || [];
          setTables(tablesArray);
          addToast('success', `Loaded ${tablesArray.length} tables from ${selectedConnection.name}`);
        } else {
          throw new Error(data.error?.message || 'Failed to fetch tables');
        }
      }
    } catch (err: any) {
      console.error('Error fetching tables:', err);
      const errorMessage = err.message || 'Failed to load tables';
      setError(errorMessage);
      addToast('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSchema = (schema: string) => {
    setExpandedSchemas((prev) => {
      const next = new Set(prev);
      if (next.has(schema)) next.delete(schema);
      else next.add(schema);
      return next;
    });
  };

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableName)) next.delete(tableName);
      else next.add(tableName);
      return next;
    });
  };

  const filteredTables = (tables || []).filter(
    (t: TableSchema) => t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleColumnClick = (column: ColumnSchema) => {
    // In a real app, this would insert into the SQL editor
    navigator.clipboard.writeText(column.name);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Database Explorer</h1>
        <p className="text-gray-400 mt-1">Browse database schemas, tables, columns, and relationships</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schema Tree */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            {/* Connection Selector */}
            <div className="mb-3">
              <label className="block text-xs text-gray-400 mb-1.5">Database Connection</label>
              <select
                value={selectedConnectionId}
                onChange={(e) => setSelectedConnectionId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name} ({conn.database})
                  </option>
                ))}
              </select>
            </div>

            {selectedConnection && (
              <div className="flex items-center gap-2 mt-3">
                <Database className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">{selectedConnection.database}</span>
                <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                  {selectedConnection.type}
                </span>
                <button
                  onClick={fetchTables}
                  disabled={isLoading}
                  className="ml-2 p-1 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
                  title="Refresh schema"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="p-2 max-h-[600px] overflow-y-auto">
            {!selectedConnection ? (
              <div className="text-center py-8 px-4">
                <Database className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium mb-2">No connection selected</p>
                {connections.length === 0 ? (
                  <div className="text-left text-xs text-gray-400 space-y-2">
                    <p className="font-medium text-gray-300">Get started:</p>
                    <div className="bg-gray-800/50 rounded p-2">
                      <p className="text-blue-400 font-medium">1. Create a connection:</p>
                      <p className="text-gray-300 mt-1">Go to Database Connections and create a new connection</p>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2">
                      <p className="text-blue-400 font-medium">2. Or use demo mode:</p>
                      <p className="text-gray-300 mt-1">The demo connection will be available after creating your first connection</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 mt-1">Please select a database connection from the dropdown above</p>
                )}
              </div>
            ) : selectedConnection.status !== 'connected' ? (
              <div className="text-center py-8 px-4">
                <Database className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium mb-2">Connection not active</p>
                <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-yellow-300">
                    Status: <span className="font-mono font-medium">{selectedConnection.status}</span>
                  </p>
                </div>
                <div className="text-left text-xs text-gray-400 space-y-2">
                  <p className="font-medium text-gray-300">To fix this:</p>
                  <div className="bg-gray-800/50 rounded p-2">
                    <p className="text-blue-400 font-medium">1. Go to Database Connections</p>
                    <p className="text-gray-300 mt-1">Click the "Test" button on your connection</p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2">
                    <p className="text-blue-400 font-medium">2. Check backend is running</p>
                    <code className="text-gray-300 block mt-1">cd server && npm run dev</code>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2">
                    <p className="text-blue-400 font-medium">3. Verify credentials</p>
                    <p className="text-gray-300 mt-1">Make sure your MySQL/SQL Server credentials are correct</p>
                  </div>
                </div>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-gray-400">Loading schema...</p>
                <p className="text-xs text-gray-600 mt-1">Fetching tables from database</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 px-4">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-sm text-red-400 font-medium mb-2">Failed to load schema</p>
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-red-300 break-words">{error}</p>
                </div>
                <div className="text-left text-xs text-gray-400 space-y-2 mb-4">
                  <p className="font-medium text-gray-300">Troubleshooting:</p>
                  {error.includes('Backend server is not running') && (
                    <div className="bg-gray-800/50 rounded p-2">
                      <p className="text-blue-400 font-medium">1. Start the backend server:</p>
                      <code className="text-gray-300 block mt-1">cd server && npm run dev</code>
                    </div>
                  )}
                  {error.includes('Connection') && (
                    <div className="bg-gray-800/50 rounded p-2">
                      <p className="text-blue-400 font-medium">2. Check your connection:</p>
                      <p className="text-gray-300 mt-1">Go to Database Connections and test the connection</p>
                    </div>
                  )}
                  {error.includes('not found') && (
                    <div className="bg-gray-800/50 rounded p-2">
                      <p className="text-blue-400 font-medium">3. Connection not in database:</p>
                      <p className="text-gray-300 mt-1">The connection may not be saved to the backend. Try recreating it.</p>
                    </div>
                  )}
                  <div className="bg-gray-800/50 rounded p-2">
                    <p className="text-blue-400 font-medium">Check browser console:</p>
                    <p className="text-gray-300 mt-1">Press F12 and check the Console tab for detailed errors</p>
                  </div>
                </div>
                <button
                  onClick={fetchTables}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : tables.length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No tables found</p>
                <p className="text-xs text-gray-600 mt-1">The database appears to be empty</p>
              </div>
            ) : (
            <>
            {/* Get unique schemas from tables */}
            {(() => {
              const schemas = Array.from(new Set(filteredTables.map(t => t.schema || 'default')));
              return schemas.map((schema) => {
                const schemaTables = filteredTables.filter(t => (t.schema || 'default') === schema);
                return (
              <div key={schema}>
                <button
                  onClick={() => toggleSchema(schema)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-800 rounded-md transition-colors"
                >
                  {expandedSchemas.has(schema) ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="font-medium">{schema}</span>
                  <span className="ml-auto text-xs text-gray-600">{schemaTables.length} tables</span>
                </button>

                {expandedSchemas.has(schema) && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {schemaTables.map((table: TableSchema) => (
                      <div key={table.name}>
                        <button
                          onClick={() => {
                            toggleTable(table.name);
                            setSelectedTable(table);
                          }}
                          className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors ${
                            selectedTable?.name === table.name
                              ? 'bg-blue-900/30 text-blue-300'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                          }`}
                        >
                          {expandedTables.has(table.name) ? (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                          )}
                          <Table2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>{table.name}</span>
                          <span className="ml-auto text-xs text-gray-600">{table.rowCount.toLocaleString()}</span>
                        </button>

                        {expandedTables.has(table.name) && (
                          <div className="ml-6 mt-0.5 space-y-0.5">
                            {table.columns.slice(0, 5).map((col: ColumnSchema) => (
                              <button
                                key={col.name}
                                onClick={() => handleColumnClick(col)}
                                className="flex items-center gap-2 w-full px-2 py-1 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 rounded transition-colors"
                                title="Click to copy column name"
                              >
                                <Columns className="w-3 h-3" />
                                <span className="font-mono">{col.name}</span>
                                <span className="ml-auto text-gray-700">{col.dataType}</span>
                                {col.isPrimaryKey && <Key className="w-3 h-3 text-yellow-500" />}
                              </button>
                            ))}
                            {table.columns.length > 5 && (
                              <span className="text-xs text-gray-600 px-2">
                                +{table.columns.length - 5} more columns
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
                );
              });
            })()}
            </>
            )}
          </div>
        </div>

        {/* Table Details */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {selectedTable ? (
            <>
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Table2 className="w-5 h-5 text-blue-400" />
                    <div>
                      <h2 className="text-lg font-semibold text-white">{selectedTable.schema}.{selectedTable.name}</h2>
                      <p className="text-xs text-gray-500">{selectedTable.rowCount.toLocaleString()} rows • {selectedTable.columns.length} columns</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors">
                      <Eye className="w-3 h-3" />
                      Preview Data
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors">
                      <Copy className="w-3 h-3" />
                      Copy Name
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mt-4">
                  {(['columns', 'indexes', 'preview'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        activeTab === tab
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4">
                {activeTab === 'columns' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Column</th>
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Type</th>
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Nullable</th>
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Key</th>
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Default</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTable.columns.map((col) => (
                          <tr key={col.name} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-white text-xs">{col.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-xs font-mono text-blue-300 bg-blue-900/30 px-1.5 py-0.5 rounded">
                                {col.dataType}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-xs text-gray-400">
                              {col.nullable ? 'Yes' : 'No'}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1">
                                {col.isPrimaryKey && (
                                  <span className="flex items-center gap-1 text-xs text-yellow-400">
                                    <Key className="w-3 h-3" /> PK
                                  </span>
                                )}
                                {col.isForeignKey && (
                                  <span className="flex items-center gap-1 text-xs text-purple-400" title={`${col.foreignKeyTable}.${col.foreignKeyColumn}`}>
                                    <Link2 className="w-3 h-3" /> FK
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-xs text-gray-500 font-mono">
                              {col.defaultValue || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'indexes' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Index Name</th>
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Columns</th>
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Unique</th>
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Clustered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTable.indexes.map((idx) => (
                          <tr key={idx.name} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                            <td className="py-2.5 px-3 font-mono text-xs text-white">{idx.name}</td>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-wrap gap-1">
                                {idx.columns.map((col) => (
                                  <span key={col} className="text-xs font-mono text-blue-300 bg-blue-900/30 px-1.5 py-0.5 rounded">
                                    {col}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-xs text-gray-400">{idx.isUnique ? 'Yes' : 'No'}</td>
                            <td className="py-2.5 px-3 text-xs text-gray-400">{idx.isClustered ? 'Yes' : 'No'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'preview' && (
                  <div className="text-center py-12">
                    <Database className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Data preview requires an active database connection</p>
                    <p className="text-gray-600 text-xs mt-1">Connect to the database to view sample data</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <Table2 className="w-16 h-16 text-gray-700 mb-4" />
              <h3 className="text-lg font-medium text-gray-400">Select a table</h3>
              <p className="text-sm text-gray-600 mt-1">Click on a table in the explorer to view its details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
