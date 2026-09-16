import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Globe,
  ExternalLink,
  MoreVertical,
  Play,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const Apis: React.FC = () => {
  const { apis } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredApis = apis.filter((api) => {
    const matchesSearch = api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.endpoint.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || api.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopyUrl = (endpoint: string, id: string) => {
    navigator.clipboard.writeText(`https://api.sqlapi.dev${endpoint}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusColors: Record<string, string> = {
    published: 'bg-green-900/50 text-green-400 border-green-800',
    draft: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
    deprecated: 'bg-orange-900/50 text-orange-400 border-orange-800',
    disabled: 'bg-red-900/50 text-red-400 border-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">APIs</h1>
          <p className="text-gray-400 mt-1">Manage your generated REST API endpoints</p>
        </div>
        <Link
          to="/apis/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create API
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search APIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'published', 'draft', 'deprecated', 'disabled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors capitalize ${
                statusFilter === status
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* API Cards */}
      <div className="space-y-3">
        {filteredApis.map((api) => (
          <div
            key={api.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${
                    api.method === 'GET' ? 'bg-green-900/50 text-green-400' :
                    api.method === 'POST' ? 'bg-blue-900/50 text-blue-400' :
                    api.method === 'PUT' ? 'bg-yellow-900/50 text-yellow-400' :
                    'bg-red-900/50 text-red-400'
                  }`}>
                    {api.method}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{api.name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${statusColors[api.status]}`}>
                    {api.status}
                  </span>
                  <span className="text-xs text-gray-600">v{api.version}</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{api.description}</p>
                <div className="flex items-center gap-4">
                  <code className="text-xs font-mono text-blue-300 bg-blue-900/20 px-2 py-1 rounded">
                    {api.endpoint}
                  </code>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {api.requestCount.toLocaleString()} requests
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {api.avgResponseTime}ms avg
                    </span>
                    {api.authRequired && (
                      <span className="flex items-center gap-1 text-amber-400">
                        🔒 Auth required
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyUrl(api.endpoint, api.id)}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {copiedId === api.id ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedId === api.id ? 'Copied' : 'Copy URL'}
                </button>
                <Link
                  to={`/apis/${api.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs font-medium transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Details
                </Link>
              </div>
            </div>

            {/* Parameters */}
            {api.parameters.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500">Parameters:</span>
                  {api.parameters.map((param) => (
                    <span
                      key={param.name}
                      className="flex items-center gap-1 px-2 py-0.5 bg-gray-800 rounded text-xs"
                    >
                      <span className="font-mono text-gray-300">{param.name}</span>
                      <span className="text-gray-600">:</span>
                      <span className="text-blue-400">{param.type}</span>
                      {param.required && <span className="text-red-400 text-[10px]">required</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredApis.length === 0 && (
        <div className="text-center py-16">
          <Globe className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400">No APIs found</h3>
          <p className="text-sm text-gray-600 mt-1">Create your first API from the SQL Editor</p>
        </div>
      )}
    </div>
  );
};
