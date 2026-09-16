import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Activity,
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const Logs: React.FC = () => {
  const { requestLogs, apis } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [apiFilter, setApiFilter] = useState<string>('all');

  const filteredLogs = requestLogs.filter((log) => {
    const matchesSearch = log.apiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'success' && log.statusCode < 400) ||
      (statusFilter === 'error' && log.statusCode >= 400);
    const matchesApi = apiFilter === 'all' || log.apiId === apiFilter;
    return matchesSearch && matchesStatus && matchesApi;
  });

  const getStatusIcon = (code: number) => {
    if (code < 300) return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
    if (code < 400) return <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />;
    return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Request Logs</h1>
          <p className="text-gray-400 mt-1">Monitor and analyze API request activity</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500">Total Requests</p>
          <p className="text-xl font-bold text-white mt-1">{requestLogs.length * 1247}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500">Success Rate</p>
          <p className="text-xl font-bold text-green-400 mt-1">98.7%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500">Avg Response Time</p>
          <p className="text-xl font-bold text-white mt-1">47ms</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500">Errors (24h)</p>
          <p className="text-xl font-bold text-red-400 mt-1">{requestLogs.filter(l => l.statusCode >= 400).length * 89}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="success">Success (2xx)</option>
          <option value="error">Errors (4xx/5xx)</option>
        </select>
        <select
          value={apiFilter}
          onChange={(e) => setApiFilter(e.target.value)}
          className="px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All APIs</option>
          {apis.map((api) => (
            <option key={api.id} value={api.id}>{api.name}</option>
          ))}
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/30">
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-xs">Timestamp</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-xs">API</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-xs">Method</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-xs">Endpoint</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-xs">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-xs">Time</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-xs">API Key</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-xs">IP</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-4 text-xs text-gray-400 font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-xs text-white whitespace-nowrap">{log.apiName}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-xs font-mono rounded ${
                      log.method === 'GET' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
                    }`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-gray-400 max-w-[200px] truncate">
                    {log.endpoint}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(log.statusCode)}
                      <span className={`text-xs font-mono ${
                        log.statusCode < 300 ? 'text-green-400' :
                        log.statusCode < 400 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {log.statusCode}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-300 font-mono">{log.responseTime}ms</td>
                  <td className="py-3 px-4 text-xs text-gray-400">{log.apiKeyName || '-'}</td>
                  <td className="py-3 px-4 text-xs text-gray-500 font-mono">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No logs match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};
