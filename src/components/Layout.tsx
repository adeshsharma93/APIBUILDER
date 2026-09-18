import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useStore } from '../store/useStore';
import { Moon, Sun, Bell, Search, User, LogOut } from 'lucide-react';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, sidebarCollapsed, currentUser, logout, addToast } = useStore();

  const handleLogout = () => {
    logout();
    addToast('success', 'Logged out successfully');
    navigate('/login');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-gray-800 bg-gray-900/80 backdrop-blur-xl">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search APIs, queries, connections..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2 pl-3 border-l border-gray-700">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white">{currentUser?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{currentUser?.email || 'user@example.com'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  React.useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => removeToast(toast.id), 5000);
      return () => clearTimeout(timer);
    });
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg border animate-slide-in flex items-center gap-3 min-w-[300px] ${
            toast.type === 'success'
              ? 'bg-green-900/90 border-green-700 text-green-200'
              : toast.type === 'error'
              ? 'bg-red-900/90 border-red-700 text-red-200'
              : toast.type === 'warning'
              ? 'bg-yellow-900/90 border-yellow-700 text-yellow-200'
              : 'bg-blue-900/90 border-blue-700 text-blue-200'
          }`}
        >
          <span className="text-sm flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-current opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
