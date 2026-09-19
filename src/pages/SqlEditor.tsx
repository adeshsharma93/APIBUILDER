import React, { useState, useCallback } from 'react';
import { SqlEditorComponent } from '../components/SqlEditor';
import {
  Play,
  Save,
  Trash2,
  AlignLeft,
  HelpCircle,
  Globe,
  Clock,
  Rows,
  ChevronRight,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { mockConnections } from '../data/mockData';
import { Link, useNavigate } from 'react-router-dom';

export const SqlEditor: React.FC = () => {
  const navigate = useNavigate();
  const { queries, addQuery, addToast, connections } = useStore();
  const [sql, setSql] = useState(`SELECT
    CustomerId,
    CustomerName,
    Email,
    Phone,
    City,
    CreatedAt
FROM dbo.Customers
WHERE Country = @country
  AND IsActive = 1
ORDER BY CreatedAt DESC;`);
  const [selectedConnection, setSelectedConnection] = useState(connections[0]?.id || '');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [queryResults, setQueryResults] = useState<any>(null);
  const pageSize = 10;

  const handleExecute = useCallback(async () => {
    if (!sql.trim()) {
      addToast('error', 'Please enter a SQL query');
      return;
    }

    if (!selectedConnection) {
      addToast('error', 'Please select a database connection');
      return;
    }

    setIsExecuting(true);
    setShowResults(false);

    try {
      const isDemoConnection = selectedConnection === 'conn-demo';
      const conn = connections.find((c: any) => c.id === selectedConnection);

      if (isDemoConnection) {
        // Use mock data for demo connection
        await new Promise((r) => setTimeout(r, 800));
        const { mockQueryResults } = await import('../data/mockData');
        setQueryResults(mockQueryResults);
        setShowResults(true);
        addToast('success', `Demo query executed — ${mockQueryResults.rowCount} rows in ${mockQueryResults.executionTime}ms`);
      } else {
        // Execute real query against production database
        const response = await fetch('http://localhost:3001/api/query/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            connectionId: selectedConnection,
            sql: sql,
            parameters: {},
            dbType: conn?.type || 'mysql',
          }),
        });

        const data = await response.json();

        if (data.success && data.data) {
          // Convert object rows to arrays for table display
          const rowsAsArrays = data.data.rows.map((row: any) => 
            data.data.columns.map((col: string) => row[col])
          );
          
          setQueryResults({
            columns: data.data.columns,
            rows: rowsAsArrays,
            rowCount: data.data.rowCount,
            executionTime: data.data.executionTime,
          });
          setShowResults(true);
          addToast('success', `Query executed successfully — ${data.data.rowCount} rows in ${data.data.executionTime}ms`);
        } else {
          throw new Error(data.error?.message || 'Query execution failed');
        }
      }
    } catch (error: any) {
      console.error('Error executing query:', error);
      addToast('error', error.message || 'Failed to execute query');
    } finally {
      setIsExecuting(false);
    }
  }, [sql, selectedConnection, connections, addToast]);

  const handleSave = () => {
    if (!queryName.trim()) {
      addToast('error', 'Please enter a query name');
      return;
    }
    // Detect parameters
    const paramRegex = /@(\w+)/g;
    const params: string[] = [];
    let match;
    while ((match = paramRegex.exec(sql)) !== null) {
      if (!params.includes(match[1])) params.push(match[1]);
    }

    addQuery({
      id: `query-${Date.now()}`,
      name: queryName,
      sql,
      connectionId: selectedConnection,
      parameters: params.map((p) => ({
        name: p,
        type: 'string' as const,
        required: true,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastExecuted: null,
      executionCount: 0,
    });
    addToast('success', 'Query saved successfully');
    setQueryName('');
  };

  const handleFormat = () => {
    // Basic SQL formatting
    const formatted = sql
      .replace(/\s+/g, ' ')
      .replace(/\bSELECT\b/gi, '\nSELECT')
      .replace(/\bFROM\b/gi, '\nFROM')
      .replace(/\bWHERE\b/gi, '\nWHERE')
      .replace(/\bORDER BY\b/gi, '\nORDER BY')
      .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
      .replace(/\bINNER JOIN\b/gi, '\nINNER JOIN')
      .replace(/\bLEFT JOIN\b/gi, '\nLEFT JOIN')
      .replace(/,/g, ',\n    ')
      .trim();
    setSql(formatted);
  };

  const paginatedRows = queryResults?.rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  ) || [];
  const totalPages = queryResults ? Math.ceil(queryResults.rows.length / pageSize) : 0;

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">SQL Editor</h1>
          <select
            value={selectedConnection}
            onChange={(e) => setSelectedConnection(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {connections.filter((c: any) => c.status === 'connected').map((conn: any) => (
              <option key={conn.id} value={conn.id}>
                {conn.name} ({conn.database})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFormat}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium transition-colors"
          >
            <AlignLeft className="w-3.5 h-3.5" />
            Format
          </button>
          <button
            onClick={() => addToast('info', 'Query explanation: This query selects active customers filtered by country, sorted by creation date.')}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Explain
          </button>
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isExecuting ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Execute
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {/* Saved queries sidebar */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-800">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Saved Queries</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {queries.map((q) => (
              <button
                key={q.id}
                onClick={() => { setSql(q.sql); setQueryName(q.name); }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-gray-800 transition-colors group"
              >
                <p className="text-white font-medium truncate">{q.name}</p>
                <p className="text-gray-500 truncate mt-0.5">{q.sql.split('\n')[0]}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Editor + Results */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          {/* Monaco Editor */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex-1 min-h-[250px]">
            <SqlEditorComponent
              value={sql}
              onChange={setSql}
              height="100%"
            />
          </div>

          {/* Save bar */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              placeholder="Query name..."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Save Query
              </button>
              <button
                onClick={() => {
                  // Save current SQL to localStorage for API Builder to pick up
                  localStorage.setItem('sql-api-builder-new-api-sql', sql);
                  localStorage.setItem('sql-api-builder-new-api-name', queryName || '');
                  navigate('/apis/new');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                Create API
              </button>          </div>

          {/* Results */}
          {showResults && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex-1 min-h-[200px] flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Rows className="w-3.5 h-3.5" />
                    <span>{queryResults?.rowCount || 0} rows</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{queryResults?.executionTime || 0}ms</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-green-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Success</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const csv = [queryResults.columns.join(','), ...queryResults.rows.map((r: any) => r.join(','))].join('\n');
                      navigator.clipboard.writeText(csv);
                      addToast('success', 'Results copied to clipboard');
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-800">
                    <tr>
                      {queryResults?.columns.map((col: string) => (
                        <th key={col} className="text-left py-2 px-3 text-gray-400 font-medium whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row: any[], i: number) => (
                      <tr key={i} className="border-t border-gray-800/50 hover:bg-gray-800/30">
                        {row.map((cell: any, j: number) => (
                          <td key={j} className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">
                            {cell === null ? <span className="text-gray-600 italic">NULL</span> : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between p-3 border-t border-gray-800">
                <span className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
