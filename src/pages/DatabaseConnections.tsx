import React, { useState } from 'react';
import {
  Database,
  Plus,
  TestTube,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw,
  Shield,
  Clock,
  Server,
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const DatabaseConnections: React.FC = () => {
  const { connections, addConnection, updateConnection, removeConnection, addToast } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    projectName: string;
    type: 'sqlserver' | 'postgresql' | 'mysql';
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    timeout: number;
  }>({
    name: '',
    projectName: 'Default Project',
    type: 'sqlserver',
    host: '',
    port: 3306,
    database: '',
    username: '',
    password: '',
    ssl: true,
    timeout: 30,
  });

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      // Get connection to determine type
      const connection = connections.find(c => c.id === id);
      const dbType = connection?.type || 'mysql';
      
      // Test connection via backend API
      const response = await fetch(`http://localhost:3001/api/connections/${id}/test?dbType=${dbType}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        updateConnection(id, { status: 'connected', lastTested: new Date().toISOString() });
        addToast('success', 'Connection test successful!');
      } else {
        updateConnection(id, { status: 'error', lastTested: new Date().toISOString() });
        addToast('error', data.error?.message || 'Connection test failed');
      }
    } catch (error: any) {
      console.error('Error testing connection:', error);
      updateConnection(id, { status: 'error', lastTested: new Date().toISOString() });
      addToast('error', error.message || 'Failed to test connection');
    } finally {
      setTestingId(null);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.host || !form.database || !form.username || !form.password) {
      addToast('error', 'Please fill in all required fields');
      return;
    }

    try {
      // Save connection to backend
      const response = await fetch('http://localhost:3001/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          projectName: form.projectName,
          type: form.type,
          host: form.host,
          port: form.port,
          database_name: form.database,
          username: form.username,
          password: form.password,
          ssl: form.ssl,
          timeout: form.timeout,
        }),
      });

      const data = await response.json();

      if (data.success && data.connection) {
        // Update local store with the backend connection
        if (editingId) {
          updateConnection(editingId, { ...form });
          addToast('success', 'Connection updated successfully');
        } else {
          addConnection({
            id: data.connection.id,
            name: form.name,
            type: form.type,
            host: form.host,
            port: form.port,
            database: form.database,
            username: form.username,
            ssl: form.ssl,
            timeout: form.timeout,
            status: 'disconnected',
            createdAt: new Date().toISOString(),
            lastTested: null,
          });
          addToast('success', 'Connection created and saved to database');
        }
        setShowForm(false);
        setEditingId(null);
        setForm({ name: '', projectName: 'Default Project', type: 'mysql', host: '', port: 3306, database: '', username: '', password: '', ssl: false, timeout: 30 });
      } else {
        throw new Error(data.error?.message || 'Failed to save connection');
      }
    } catch (error: any) {
      console.error('Error saving connection:', error);
      addToast('error', error.message || 'Failed to save connection to database');
    }
  };

  const handleEdit = (conn: typeof connections[0]) => {
    setForm({
      name: conn.name,
      projectName: 'Default Project', // Default for existing connections
      type: conn.type,
      host: conn.host,
      port: conn.port,
      database: conn.database,
      username: conn.username,
      password: '',
      ssl: conn.ssl,
      timeout: conn.timeout,
    });
    setEditingId(conn.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Database Connections</h1>
          <p className="text-gray-400 mt-1">Manage your database connections securely</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Reset to demo data
              localStorage.removeItem('sql-api-builder-storage');
              window.location.reload();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Demo
          </button>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', projectName: 'Default Project', type: 'mysql', host: '', port: 3306, database: '', username: '', password: '', ssl: false, timeout: 30 }); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Connection
          </button>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-200 font-medium">Credentials are encrypted at rest</p>
          <p className="text-xs text-blue-300/70 mt-1">
            Database passwords are encrypted using AES-256 and never exposed to the frontend after saving. All connections use TLS/SSL.
          </p>
        </div>
      </div>

      {/* Connection Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Edit Connection' : 'New Database Connection'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">Connect to a SQL Server database</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Connection Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Production SQL Server"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Project Name *</label>
                <input
                  type="text"
                  value={form.projectName}
                  onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                  placeholder="e.g., Default Project"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Organize connections by project. A new project will be created if it doesn't exist.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Database Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'sqlserver' | 'postgresql' | 'mysql' })}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mysql">MySQL</option>
                  <option value="sqlserver">Microsoft SQL Server</option>
                  <option value="postgresql" disabled>PostgreSQL (Coming Soon)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Host *</label>
                  <input
                    type="text"
                    value={form.host}
                    onChange={(e) => setForm({ ...form, host: e.target.value })}
                    placeholder="localhost"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Port</label>
                  <input
                    type="number"
                    value={form.port}
                    onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Database Name *</label>
                <input
                  type="text"
                  value={form.database}
                  onChange={(e) => setForm({ ...form, database: e.target.value })}
                  placeholder="AdventureWorks"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Username *</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="sa"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Password *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.ssl}
                    onChange={(e) => setForm({ ...form, ssl: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-300">SSL/TLS</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Timeout (s)</label>
                  <input
                    type="number"
                    value={form.timeout}
                    onChange={(e) => setForm({ ...form, timeout: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {editingId ? 'Update Connection' : 'Save Connection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {connections.map((conn) => (
          <div
            key={conn.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  conn.status === 'connected' ? 'bg-green-900/50' :
                  conn.status === 'error' ? 'bg-red-900/50' : 'bg-gray-800'
                }`}>
                  <Server className={`w-5 h-5 ${
                    conn.status === 'connected' ? 'text-green-400' :
                    conn.status === 'error' ? 'text-red-400' : 'text-gray-400'
                  }`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{conn.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{conn.type.replace('sqlserver', 'SQL Server')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  conn.status === 'connected' ? 'bg-green-900/50 text-green-400' :
                  conn.status === 'error' ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-400'
                }`}>
                  {conn.status === 'connected' ? <CheckCircle2 className="w-3 h-3" /> :
                   conn.status === 'error' ? <XCircle className="w-3 h-3" /> :
                   <AlertCircle className="w-3 h-3" />}
                  {conn.status}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Database className="w-3 h-3" />
                <span className="font-mono">{conn.host}:{conn.port}/{conn.database}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Shield className="w-3 h-3" />
                <span>SSL: {conn.ssl ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>Timeout: {conn.timeout}s</span>
              </div>
              {conn.lastTested && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <RefreshCw className="w-3 h-3" />
                  <span>Last tested: {new Date(conn.lastTested).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
              <button
                onClick={() => handleTestConnection(conn.id)}
                disabled={testingId === conn.id}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                {testingId === conn.id ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <TestTube className="w-3 h-3" />
                )}
                Test
              </button>
              <button
                onClick={() => handleEdit(conn)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium transition-colors"
              >
                <Edit className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => { removeConnection(conn.id); addToast('info', 'Connection removed'); }}
                className="flex items-center justify-center p-2 bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
