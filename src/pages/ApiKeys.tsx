import React, { useState } from 'react';
import {
  Plus,
  Key,
  Copy,
  CheckCircle2,
  Trash2,
  RotateCw,
  Shield,
  Clock,
  Activity,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const ApiKeys: React.FC = () => {
  const { apiKeys, apis, addApiKey, updateApiKey, removeApiKey, addToast } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyApis, setNewKeyApis] = useState<string[]>([]);
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      addToast('error', 'Please enter a key name');
      return;
    }
    const rawKey = `sk_live_${Math.random().toString(36).substring(2, 6)}${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    setGeneratedKey(rawKey);
    addApiKey({
      id: `key-${Date.now()}`,
      name: newKeyName,
      keyPrefix: `sk_live_${rawKey.substring(7, 11)}`,
      createdAt: new Date().toISOString(),
      expiresAt: newKeyExpiry ? new Date(newKeyExpiry).toISOString() : null,
      lastUsed: null,
      isActive: true,
      apis: newKeyApis,
      requestCount: 0,
    });
    addToast('success', 'API key created successfully');
    setNewKeyName('');
    setNewKeyApis([]);
    setNewKeyExpiry('');
  };

  const handleRevoke = (id: string) => {
    updateApiKey(id, { isActive: false });
    addToast('warning', 'API key revoked');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="text-gray-400 mt-1">Manage API keys for authenticating API requests</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Key
        </button>
      </div>

      {/* Security Notice */}
      <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-amber-200 font-medium">API keys are hashed and never stored in plain text</p>
          <p className="text-xs text-amber-300/70 mt-1">
            The full key is only shown once when created. Store it securely. Keys are hashed using SHA-256 with salt.
          </p>
        </div>
      </div>

      {/* Generated Key Modal */}
      {generatedKey && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">API Key Created</h2>
              <p className="text-sm text-red-400 mt-1">⚠️ Copy this key now. It will not be shown again.</p>
            </div>
            <div className="p-6">
              <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm text-white break-all">
                {generatedKey}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedKey);
                  addToast('success', 'Key copied to clipboard');
                }}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy Key
              </button>
            </div>
            <div className="p-6 border-t border-gray-800">
              <button
                onClick={() => { setGeneratedKey(null); setShowCreateForm(false); }}
                className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                I've saved the key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && !generatedKey && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Create New API Key</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production Frontend"
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Allowed APIs</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {apis.map((api) => (
                  <label key={api.id} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800">
                    <input
                      type="checkbox"
                      checked={newKeyApis.includes(api.id)}
                      onChange={(e) => {
                        if (e.target.checked) setNewKeyApis([...newKeyApis, api.id]);
                        else setNewKeyApis(newKeyApis.filter(id => id !== api.id));
                      }}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-white">{api.name}</span>
                    <span className="text-xs text-gray-500 font-mono ml-auto">{api.endpoint}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Expiration (optional)</label>
              <input
                type="date"
                value={newKeyExpiry}
                onChange={(e) => setNewKeyExpiry(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateKey}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Generate Key
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keys List */}
      <div className="space-y-3">
        {apiKeys.map((key) => (
          <div
            key={key.id}
            className={`bg-gray-900 border rounded-xl p-5 transition-colors ${
              key.isActive ? 'border-gray-800 hover:border-gray-700' : 'border-gray-800/50 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  key.isActive ? 'bg-green-900/50' : 'bg-gray-800'
                }`}>
                  <Key className={`w-5 h-5 ${key.isActive ? 'text-green-400' : 'text-gray-500'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{key.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs font-mono text-gray-400">{key.keyPrefix}••••••••••••</code>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      key.isActive ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                    }`}>
                      {key.isActive ? 'Active' : 'Revoked'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {key.isActive && (
                  <button
                    onClick={() => handleRevoke(key.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Shield className="w-3 h-3" />
                    Revoke
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-800">
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-xs text-white mt-0.5">{new Date(key.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Expires</p>
                <p className="text-xs text-white mt-0.5">{key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Used</p>
                <p className="text-xs text-white mt-0.5">{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Requests</p>
                <p className="text-xs text-white mt-0.5">{key.requestCount.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2">Allowed APIs: {key.apis.length}</p>
              <div className="flex flex-wrap gap-1">
                {key.apis.map((apiId) => {
                  const api = apis.find(a => a.id === apiId);
                  return api ? (
                    <span key={apiId} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300">
                      {api.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
