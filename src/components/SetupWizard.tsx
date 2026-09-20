import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Database, Zap, CheckCircle, ArrowRight, X } from 'lucide-react';

export const SetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useStore();
  const [step, setStep] = useState(1);
  const [showWizard, setShowWizard] = useState(true);

  const handleDemoMode = () => {
    addToast('success', 'Demo mode activated! You can explore all features with sample data.');
    setShowWizard(false);
    navigate('/');
  };

  const handleRealDatabase = () => {
    setShowWizard(false);
    navigate('/connections');
  };

  if (!showWizard) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Welcome to SQL API Builder</h2>
              <p className="text-sm text-gray-400">Let's get you started</p>
            </div>
          </div>
          <button
            onClick={() => setShowWizard(false)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-6">
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-blue-600' : 'bg-gray-800'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Choose Your Setup</h3>
              <p className="text-sm text-gray-400">
                SQL API Builder can work in two modes: Demo mode with sample data, or connect to your real database.
              </p>

              <div className="space-y-3 mt-6">
                <button
                  onClick={handleDemoMode}
                  className="w-full p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg hover:border-blue-500/50 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">
                        Try Demo Mode
                        <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">Recommended</span>
                      </h4>
                      <p className="text-sm text-gray-400">
                        Explore all features with sample data. No database setup required.
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-gray-500">
                        <li>✓ Pre-configured sample database</li>
                        <li>✓ Sample APIs and queries ready to use</li>
                        <li>✓ Full feature access</li>
                        <li>✓ Perfect for learning and testing</li>
                      </ul>
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                <button
                  onClick={handleRealDatabase}
                  className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Database className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">Connect Real Database</h4>
                      <p className="text-sm text-gray-400">
                        Connect to your MySQL or SQL Server database and start creating APIs.
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-gray-500">
                        <li>✓ Connect to MySQL or SQL Server</li>
                        <li>✓ Create APIs from your data</li>
                        <li>✓ Production-ready setup</li>
                        <li>✓ Full control over your data</li>
                      </ul>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Demo Mode Features</h3>
              <p className="text-sm text-gray-400">
                In demo mode, you'll have access to:
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4">
                {[
                  { title: 'Sample Database', desc: 'Pre-configured with sample tables' },
                  { title: 'Sample APIs', desc: '3 ready-to-use API endpoints' },
                  { title: 'SQL Editor', desc: 'Test queries with sample data' },
                  { title: 'API Keys', desc: 'Pre-generated API keys for testing' },
                  { title: 'Request Logs', desc: 'Sample API request history' },
                  { title: 'Documentation', desc: 'Auto-generated API docs' },
                ].map((feature, i) => (
                  <div key={i} className="p-3 bg-gray-800/50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-400 mb-2" />
                    <h4 className="text-sm font-medium text-white">{feature.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                <p className="text-sm text-blue-200">
                  <strong>Note:</strong> Demo mode uses mock data stored in your browser. 
                  You can switch to a real database anytime from the Database Connections page.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleDemoMode}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Start Demo Mode
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Database Setup Guide</h3>
              <p className="text-sm text-gray-400">
                To connect your real database, you'll need:
              </p>

              <div className="space-y-3 mt-4">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">1. Database Server</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• MySQL 8.0+ or SQL Server 2019+</li>
                    <li>• Running on localhost or remote server</li>
                    <li>• Network access from this application</li>
                  </ul>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">2. Database Credentials</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Host address (e.g., localhost or IP)</li>
                    <li>• Port number (3306 for MySQL, 1433 for SQL Server)</li>
                    <li>• Database name</li>
                    <li>• Username and password</li>
                  </ul>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">3. Backend Server</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Node.js backend running on port 3001</li>
                    <li>• Database connection configured in .env file</li>
                    <li>• See README.md for setup instructions</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-900/20 border border-amber-800/50 rounded-lg">
                <p className="text-sm text-amber-200">
                  <strong>Don't have a database yet?</strong> Start with demo mode to explore the features, 
                  then connect your real database later.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleRealDatabase}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Go to Database Connections
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-900/50">
          <p className="text-xs text-gray-500 text-center">
            You can always change your setup later from the Database Connections page
          </p>
        </div>
      </div>
    </div>
  );
};
