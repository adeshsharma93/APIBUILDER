import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DatabaseConnections } from './pages/DatabaseConnections';
import { DatabaseExplorer } from './pages/DatabaseExplorer';
import { SqlEditor } from './pages/SqlEditor';
import { Apis } from './pages/Apis';
import { ApiDetail } from './pages/ApiDetail';
import { ApiBuilder } from './pages/ApiBuilder';
import { ApiKeys } from './pages/ApiKeys';
import { Logs } from './pages/Logs';
import { Documentation } from './pages/Documentation';
import { SettingsPage } from './pages/Settings';
import { Login } from './pages/Login';
import { Users } from './pages/Users';
import { Projects } from './pages/Projects';
import { DataInitializer } from './components/DataInitializer';
import { useStore } from './store/useStore';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/connections" element={<DatabaseConnections />} />
          <Route path="/explorer" element={<DatabaseExplorer />} />
          <Route path="/editor" element={<SqlEditor />} />
          <Route path="/apis" element={<Apis />} />
          <Route path="/apis/new" element={<ApiBuilder />} />
          <Route path="/apis/:id" element={<ApiDetail />} />
          <Route path="/api-keys" element={<ApiKeys />} />
          <Route path="/users" element={<Users />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
