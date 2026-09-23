import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Globe,
  Clock,
  Bell,
  Users,
  Database,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const SettingsPage: React.FC = () => {
  const { addToast } = useStore();
  const [activeSection, setActiveSection] = useState('general');

  const sections = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Defaults', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'users', label: 'Users & Roles', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure your SQL API Builder platform</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'general' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-white">General Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Platform Name</label>
                  <input
                    type="text"
                    defaultValue="SQL API Builder"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Base URL</label>
                  <input
                    type="text"
                    defaultValue="https://api.sqlapi.dev"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Default Timezone</label>
                  <select className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option>UTC</option>
                    <option>America/New_York</option>
                    <option>Europe/London</option>
                    <option>Asia/Kolkata</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => addToast('success', 'Settings saved successfully')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-white">Security Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">Enforce SSL/TLS</p>
                    <p className="text-xs text-gray-500 mt-0.5">Require encrypted connections for all database connections</p>
                  </div>
                  <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">Block Dangerous SQL</p>
                    <p className="text-xs text-gray-500 mt-0.5">Prevent DROP, TRUNCATE, ALTER, DELETE in API queries</p>
                  </div>
                  <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">Parameterized Queries Only</p>
                    <p className="text-xs text-gray-500 mt-0.5">Always use parameterized SQL for API parameters</p>
                  </div>
                  <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">Audit Logging</p>
                    <p className="text-xs text-gray-500 mt-0.5">Record all administrative actions</p>
                  </div>
                  <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Default Query Timeout (seconds)</label>
                  <input
                    type="number"
                    defaultValue={30}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Maximum Rows per Query</label>
                  <input
                    type="number"
                    defaultValue={1000}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={() => addToast('success', 'Security settings saved')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          )}

          {activeSection === 'api' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-white">API Default Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Default Rate Limit (requests/minute)</label>
                  <input
                    type="number"
                    defaultValue={100}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Default Cache Duration (seconds)</label>
                  <input
                    type="number"
                    defaultValue={60}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Default Page Size</label>
                  <input
                    type="number"
                    defaultValue={50}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Max Response Size (MB)</label>
                  <input
                    type="number"
                    defaultValue={10}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">Require Authentication by Default</p>
                    <p className="text-xs text-gray-500 mt-0.5">New APIs will require API key authentication</p>
                  </div>
                  <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full" />
                  </div>
                </div>
              </div>
              <button
                onClick={() => addToast('success', 'API settings saved')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-white">Notification Settings</h3>
              <div className="space-y-4">
                {[
                  { label: 'API Error Alerts', desc: 'Get notified when APIs return errors', enabled: true },
                  { label: 'Rate Limit Warnings', desc: 'Alert when APIs approach rate limits', enabled: true },
                  { label: 'Database Connection Issues', desc: 'Notify on connection failures', enabled: true },
                  { label: 'Query Timeout Alerts', desc: 'Alert when queries exceed timeout', enabled: false },
                  { label: 'Weekly Summary', desc: 'Receive weekly usage summary', enabled: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative cursor-pointer ${item.enabled ? 'bg-blue-600' : 'bg-gray-700'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${item.enabled ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-white">Users & Roles</h3>
              <div className="space-y-3">
                {[
                  { name: 'Admin User', email: 'admin@sqlapi.dev', role: 'Admin', status: 'Active' },
                  { name: 'Developer User', email: 'dev@sqlapi.dev', role: 'Developer', status: 'Active' },
                  { name: 'Viewer User', email: 'viewer@sqlapi.dev', role: 'Viewer', status: 'Active' },
                ].map((user, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">{user.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        user.role === 'Admin' ? 'bg-purple-900/50 text-purple-400' :
                        user.role === 'Developer' ? 'bg-blue-900/50 text-blue-400' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {user.role}
                      </span>
                      <span className="text-xs text-green-400">{user.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-800">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Role Permissions</h4>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-purple-400 font-medium mb-1">Admin</p>
                    <ul className="text-gray-500 space-y-0.5">
                      <li>• Full access</li>
                      <li>• Manage users</li>
                      <li>• Manage connections</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-blue-400 font-medium mb-1">Developer</p>
                    <ul className="text-gray-500 space-y-0.5">
                      <li>• Create/edit APIs</li>
                      <li>• Execute SQL</li>
                      <li>• View schemas</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium mb-1">Viewer</p>
                    <ul className="text-gray-500 space-y-0.5">
                      <li>• View APIs</li>
                      <li>• View docs</li>
                      <li>• Read-only</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
