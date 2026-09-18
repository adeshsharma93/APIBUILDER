import React, { useState, useEffect } from 'react';
import {
  Database,
  Globe,
  Activity,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useStore } from '../store/useStore';
import { chartData } from '../data/mockData';
import { Link } from 'react-router-dom';
import { SetupWizard } from '../components/SetupWizard';

export const Dashboard: React.FC = () => {
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  useEffect(() => {
    // Show setup wizard on first visit
    const hasVisited = localStorage.getItem('sql-api-builder-has-visited');
    if (!hasVisited) {
      setShowSetupWizard(true);
      localStorage.setItem('sql-api-builder-has-visited', 'true');
    }
  }, []);
  const { connections, apis, requestLogs } = useStore();

  const connectedCount = connections.filter((c) => c.status === 'connected').length;
  const publishedApis = apis.filter((a) => a.status === 'published').length;
  const todayRequests = requestLogs.length * 1247; // Simulated
  const failedRequests = requestLogs.filter((l) => l.statusCode >= 400).length * 89;
  const avgResponseTime = 47;

  const metrics = [
    {
      label: 'Connected Databases',
      value: connectedCount,
      total: connections.length,
      icon: Database,
      color: 'from-blue-500 to-blue-600',
      change: '+1 this week',
      trend: 'up' as const,
    },
    {
      label: 'Published APIs',
      value: publishedApis,
      total: apis.length,
      icon: Globe,
      color: 'from-green-500 to-green-600',
      change: '+2 this week',
      trend: 'up' as const,
    },
    {
      label: 'API Requests Today',
      value: todayRequests.toLocaleString(),
      icon: Activity,
      color: 'from-purple-500 to-purple-600',
      change: '+12% vs yesterday',
      trend: 'up' as const,
    },
    {
      label: 'Failed Requests',
      value: failedRequests,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      change: '-5% vs yesterday',
      trend: 'down' as const,
    },
    {
      label: 'Avg Response Time',
      value: `${avgResponseTime}ms`,
      icon: Clock,
      color: 'from-amber-500 to-amber-600',
      change: '-8ms vs yesterday',
      trend: 'down' as const,
    },
  ];

  const recentApis = apis.slice(0, 4);
  const recentLogs = requestLogs.slice(0, 6);

  return (
    <>
      {showSetupWizard && <SetupWizard />}
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Overview of your SQL API Builder platform</p>
        </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {metrics.map((metric, i) => (
          <div
            key={i}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                <metric.icon className="w-5 h-5 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-xs ${metric.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {metric.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {metric.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{metric.value}</p>
            <p className="text-sm text-gray-400 mt-1">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests over time */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Requests Over Time</h3>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Last 24h</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData.requestsOverTime}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Area type="monotone" dataKey="requests" stroke="#3b82f6" fill="url(#colorRequests)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Response times */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Response Time (ms)</h3>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Last 24h</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData.responseTimes}>
              <defs>
                <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Area type="monotone" dataKey="avg" stroke="#10b981" fill="url(#colorAvg)" strokeWidth={2} name="Avg" />
              <Area type="monotone" dataKey="p95" stroke="#f59e0b" fill="none" strokeWidth={1.5} strokeDasharray="5 5" name="P95" />
              <Area type="monotone" dataKey="p99" stroke="#ef4444" fill="none" strokeWidth={1.5} strokeDasharray="5 5" name="P99" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top APIs & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top APIs */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Top APIs</h3>
            <Link to="/apis" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View all <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.topApis} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={12} width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Bar dataKey="requests" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="errors" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent APIs */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent APIs</h3>
            <Link to="/apis" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View all <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentApis.map((api) => (
              <Link
                key={api.id}
                to={`/apis/${api.id}`}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-xs font-mono rounded ${
                    api.method === 'GET' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
                  }`}>
                    {api.method}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{api.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{api.endpoint}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    api.status === 'published' ? 'bg-green-500' :
                    api.status === 'draft' ? 'bg-yellow-500' :
                    api.status === 'deprecated' ? 'bg-orange-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-gray-400 capitalize">{api.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent API Requests</h3>
          <Link to="/logs" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
            View all logs <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Time</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">API</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Method</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Response</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-3 px-4 text-gray-400 text-xs font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 text-white text-xs">{log.apiName}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-xs font-mono rounded ${
                      log.method === 'GET' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
                    }`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`flex items-center gap-1 text-xs ${
                      log.statusCode < 300 ? 'text-green-400' :
                      log.statusCode < 400 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {log.statusCode < 300 ? <CheckCircle2 className="w-3 h-3" /> :
                       log.statusCode < 400 ? <AlertCircle className="w-3 h-3" /> :
                       <XCircle className="w-3 h-3" />}
                      {log.statusCode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{log.responseTime}ms</td>
                  <td className="py-3 px-4 text-gray-500 text-xs font-mono">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
};
