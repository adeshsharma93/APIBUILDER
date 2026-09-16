import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/connections" element={<DatabaseConnections />} />
          <Route path="/explorer" element={<DatabaseExplorer />} />
          <Route path="/editor" element={<SqlEditor />} />
          <Route path="/apis" element={<Apis />} />
          <Route path="/apis/new" element={<ApiBuilder />} />
          <Route path="/apis/:id" element={<ApiDetail />} />
          <Route path="/api-keys" element={<ApiKeys />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
