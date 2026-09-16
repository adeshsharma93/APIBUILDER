import React, { useState } from 'react';
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
} from 'lucide-react';
import { mockTables, mockConnections } from '../data/mockData';
import { TableSchema, ColumnSchema } from '../types';

export const DatabaseExplorer: React.FC = () => {
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set(['dbo']));
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [selectedTable, setSelectedTable] = useState<TableSchema | null>(null);
  const [activeTab, setActiveTab] = useState<'columns' | 'indexes' | 'preview'>('columns');
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredTables = mockTables.filter(
    (t) => t.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">{mockConnections[0].database}</span>
              <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                {mockConnections[0].type}
              </span>
            </div>
            <div className="relative">
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
            {/* Schemas */}
            {['dbo'].map((schema) => (
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
                  <span className="ml-auto text-xs text-gray-600">{filteredTables.length} tables</span>
                </button>

                {expandedSchemas.has(schema) && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {filteredTables.map((table) => (
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
                            {table.columns.slice(0, 5).map((col) => (
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
            ))}
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
