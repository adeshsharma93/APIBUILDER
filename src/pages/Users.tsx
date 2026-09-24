import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Mail, Calendar, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

const API_BASE_URL = 'http://localhost:3001/api';

// Mapped to the MySQL `users` table canonical schema
// (server/migrations/mysql/002_users_projects.sql + 003_add_username_to_users.sql):
//   id CHAR(36)            -> id
//   username VARCHAR(50)   -> username
//   email VARCHAR(100)     -> email
//   password_hash          -> (write-only via API; never returned by GET /api/users)
//   role ENUM(...)         -> role
//   created_at TIMESTAMP   -> created_at
//   updated_at TIMESTAMP   -> updated_at (not currently selected by the API)
interface User {
  id: string;             // users.id
  username: string;       // users.username
  email: string;          // users.email
  role: 'admin' | 'developer' | 'viewer'; // users.role (ENUM)
  created_at: string;     // users.created_at (TIMESTAMP)
  updated_at?: string;    // users.updated_at (TIMESTAMP, if present)
}

async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // non-JSON response
  }
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }
  return data as T;
}

// Fallback demo data so the page still works when the backend is unavailable
const DEMO_USERS: User[] = [
  { id: 'demo-user-1', username: 'Admin User', email: 'admin@sqlapi.dev', role: 'admin', created_at: new Date().toISOString() },
  { id: 'demo-user-2', username: 'Developer User', email: 'dev@sqlapi.dev', role: 'developer', created_at: new Date().toISOString() },
];

export default function Users() {
  const { addToast } = useStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'developer' as 'admin' | 'developer' | 'viewer'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<{ success: boolean; data: User[] }>('/users');
      setUsers(result.data ?? []);
      setOffline(false);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      // Backend unreachable – fall back to local demo data instead of a blank page
      setUsers((prev) => (prev.length > 0 ? prev : DEMO_USERS));
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
      addToast('error', 'Username, email, and password are required');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/users', { method: 'POST', body: JSON.stringify(formData) });
      addToast('success', 'User created successfully!');
      setFormData({ username: '', email: '', password: '', role: 'developer' });
      setShowForm(false);
      fetchUsers();
    } catch (err: any) {
      if (offline) {
        // Local fallback creation while backend is down
        const newUser: User = {
          id: `local-${Date.now()}`,
          username: formData.username.trim(),
          email: formData.email.trim(),
          role: formData.role,
          created_at: new Date().toISOString(),
        };
        setUsers((prev) => [newUser, ...prev]);
        addToast('warning', 'Backend offline – user added locally only (not persisted to the database).');
        setFormData({ username: '', email: '', password: '', role: 'developer' });
        setShowForm(false);
      } else {
        addToast('error', err?.message || 'Failed to create user');
        setError(err?.message || 'Failed to create user');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (offline) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole as User['role'] } : u)));
      addToast('warning', 'Backend offline – role changed locally only.');
      return;
    }
    try {
      await apiRequest(`/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role: newRole }) });
      addToast('success', 'Role updated successfully!');
      fetchUsers();
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to update role');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    if (offline) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      addToast('warning', 'Backend offline – user removed locally only.');
      return;
    }
    try {
      await apiRequest(`/users/${userId}`, { method: 'DELETE' });
      addToast('success', 'User deleted successfully!');
      fetchUsers();
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to delete user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'developer': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage user accounts and roles</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UserPlus size={18} />
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {/* Offline / Error Banners */}
      {offline && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Backend is not reachable on port 3001 – showing demo data. Changes are local only and will not be saved to the database.
            </p>
            <p className="text-xs text-amber-700 mt-1">Start the server with <code className="bg-amber-100 px-1 rounded">npm run dev</code> inside the <code className="bg-amber-100 px-1 rounded">server/</code> folder, then retry.</p>
          </div>
          <button
            onClick={fetchUsers}
            className="px-3 py-1.5 bg-white text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      )}
      {!offline && error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium text-red-800 flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="px-3 py-1.5 bg-white text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add User Form */}
      {showForm && (
        <div className="mb-6 p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
            <UserPlus size={20} className="text-blue-600" />
            Create New User
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-xs font-normal text-gray-400">(users.username)</span></label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-xs font-normal text-gray-400">(users.email)</span></label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-xs font-normal text-gray-400">(→ users.password_hash, bcrypt)</span></label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-xs font-normal text-gray-400">(users.role ENUM)</span></label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="admin">Admin</option>
                  <option value="developer">Developer</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Column labels mirror the MySQL `users` schema */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username <span className="normal-case font-normal text-gray-400">(users.username)</span></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email <span className="normal-case font-normal text-gray-400">(users.email)</span></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role <span className="normal-case font-normal text-gray-400">(users.role)</span></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At <span className="normal-case font-normal text-gray-400">(users.created_at)</span></th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-600">
                    <AlertCircle size={48} className="mx-auto mb-2 opacity-50" />
                    <p>{error}</p>
                    <button
                      onClick={fetchUsers}
                      className="mt-3 px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <UserPlus size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No users found. Create your first user!</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">{user.username.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail size={14} className="mr-2" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getRoleBadgeColor(user.role)} cursor-pointer hover:opacity-80 transition-opacity`}
                      >
                        <option value="admin">Admin</option>
                        <option value="developer">Developer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar size={14} className="mr-2" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
