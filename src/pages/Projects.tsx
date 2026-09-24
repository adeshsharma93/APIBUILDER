import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, Users, UserPlus, X, Check, Trash2, Settings, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

const API_BASE_URL = 'http://localhost:3001/api';

interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  owner_name: string;
  created_at: string;
  members?: any[];
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
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

// Fallback demo users so the owner selector works even when the backend is down
const DEMO_USERS: User[] = [
  { id: 'demo-user-1', username: 'Admin User', email: 'admin@sqlapi.dev', role: 'admin' },
  { id: 'demo-user-2', username: 'Developer User', email: 'dev@sqlapi.dev', role: 'developer' },
];

export default function Projects() {
  const navigate = useNavigate();
  const { addToast } = useStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ownerId: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<{ success: boolean; data: Project[] }>('/projects');
      setProjects(result.data ?? []);
      setOffline(false);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      // Backend unreachable – keep local list instead of a blank page
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const result = await apiRequest<{ success: boolean; data: User[] }>('/users');
      setUsers(result.data ?? []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers((prev) => (prev.length > 0 ? prev : DEMO_USERS));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('error', 'Project name is required');
      return;
    }
    if (!formData.ownerId) {
      addToast('error', 'Please select a project owner');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/projects', { method: 'POST', body: JSON.stringify(formData) });
      addToast('success', 'Project created successfully!');
      setFormData({ name: '', description: '', ownerId: '' });
      setShowForm(false);
      fetchProjects();
    } catch (err: any) {
      if (offline) {
        // Local fallback creation while backend is down
        const owner = users.find((u) => u.id === formData.ownerId);
        const newProject: Project = {
          id: `local-${Date.now()}`,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          owner_id: formData.ownerId,
          owner_name: owner?.username || 'Unknown',
          created_at: new Date().toISOString(),
          members: [],
        };
        setProjects((prev) => [newProject, ...prev]);
        addToast('warning', 'Backend offline – project added locally only (not persisted to the database).');
        setFormData({ name: '', description: '', ownerId: '' });
        setShowForm(false);
      } else {
        addToast('error', err?.message || 'Failed to create project');
        setError(err?.message || 'Failed to create project');
      }
    } finally {
      setSaving(false);
    }
  };

  const viewProjectDetails = async (projectId: string) => {
    try {
      const result = await apiRequest<{ success: boolean; data: Project }>(`/projects/${projectId}`);
      setSelectedProject(result.data);
    } catch (err: any) {
      // Backend unreachable – show the locally-known project data instead of failing
      const local = projects.find((p) => p.id === projectId);
      if (local) {
        setSelectedProject(local);
        addToast('warning', 'Backend offline – showing locally cached project details.');
      } else {
        addToast('error', err?.message || 'Error fetching project details');
      }
    }
  };

  const addMember = async (projectId: string, userId: string, role: string) => {
    if (!userId) {
      addToast('error', 'Please select a user to add');
      return;
    }
    try {
      await apiRequest(`/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify({ userId, role }) });
      addToast('success', 'Member added successfully!');
      viewProjectDetails(projectId);
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to add member');
    }
  };

  const updateMemberRole = async (projectId: string, userId: string, role: string) => {
    try {
      await apiRequest(`/projects/${projectId}/members/${userId}`, { method: 'PUT', body: JSON.stringify({ role }) });
      addToast('success', 'Role updated successfully!');
      viewProjectDetails(projectId);
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to update role');
    }
  };

  const removeMember = async (projectId: string, userId: string) => {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await apiRequest(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
      addToast('success', 'Member removed successfully!');
      viewProjectDetails(projectId);
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to remove member');
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
          <h1 className="text-2xl font-bold text-gray-900">Projects Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage your projects</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <FolderPlus size={18} />
          {showForm ? 'Cancel' : 'Create Project'}
        </button>
      </div>

      {/* Offline / Error Banners */}
      {offline && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Backend is not reachable on port 3001 – changes are local only and will not be saved to the database.
            </p>
            <p className="text-xs text-amber-700 mt-1">Start the server with <code className="bg-amber-100 px-1 rounded">npm run dev</code> inside the <code className="bg-amber-100 px-1 rounded">server/</code> folder, then retry.</p>
          </div>
          <button
            onClick={fetchProjects}
            className="px-3 py-1.5 bg-white text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      )}
      {!offline && error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="px-3 py-1.5 bg-white text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create Project Form */}
      {showForm && (
        <div className="mb-6 p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
            <FolderPlus size={20} className="text-blue-600" />
            Create New Project
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="Enter project name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Owner</label>
                <select
                  value={formData.ownerId}
                  onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                >
                  <option value="">Select Owner</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.username} ({user.email})</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  placeholder="Enter project description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
          <FolderPlus size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-4">Create your first project to get started</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FolderPlus size={18} />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FolderPlus size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500">Owner: {project.owner_name}</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mb-4 line-clamp-2">{project.description || 'No description provided'}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{project.members?.length || 0} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check size={14} />
                  <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => viewProjectDetails(project.id)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Settings size={14} />
                  View Details
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('currentProjectId', project.id);
                    navigate('/connections');
                  }}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FolderPlus size={14} />
                  Connections
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderPlus size={24} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
                  <p className="text-sm text-gray-500">Project Details</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProject(null)} 
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6 pb-6 border-b border-gray-200">
              {selectedProject.description || 'No description provided'}
            </p>
            
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
              <Users size={20} className="text-blue-600" />
              Project Members
            </h3>
            <div className="space-y-3 mb-6">
              {selectedProject.members?.map((member: any) => (
                <div key={member.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">{member.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.username}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => updateMemberRole(selectedProject.id, member.user_id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="developer">Developer</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    {member.user_id !== selectedProject.owner_id && (
                      <button
                        onClick={() => removeMember(selectedProject.id, member.user_id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
              <UserPlus size={20} className="text-green-600" />
              Add New Member
            </h3>
            <div className="flex gap-3">
              <select id="newMemberUser" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                <option value="">Select User</option>
                {users.filter(u => !selectedProject.members?.some(m => m.user_id === u.id)).map(user => (
                  <option key={user.id} value={user.id}>{user.username} ({user.email})</option>
                ))}
              </select>
              <select id="newMemberRole" className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                onClick={() => {
                  const userId = (document.getElementById('newMemberUser') as HTMLSelectElement).value;
                  const role = (document.getElementById('newMemberRole') as HTMLSelectElement).value;
                  if (userId) addMember(selectedProject.id, userId, role);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <UserPlus size={16} />
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
