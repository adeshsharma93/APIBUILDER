import { create } from 'zustand';
import { DatabaseConnection, ApiDefinition, ApiKey, ApiRequestLog, SqlQuery } from '../types';
import { mockConnections, mockApis, mockApiKeys, mockRequestLogs, mockQueries } from '../data/mockData';

interface AppState {
  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Connections
  connections: DatabaseConnection[];
  addConnection: (conn: DatabaseConnection) => void;
  updateConnection: (id: string, conn: Partial<DatabaseConnection>) => void;
  removeConnection: (id: string) => void;

  // APIs
  apis: ApiDefinition[];
  addApi: (api: ApiDefinition) => void;
  updateApi: (id: string, api: Partial<ApiDefinition>) => void;
  removeApi: (id: string) => void;

  // API Keys
  apiKeys: ApiKey[];
  addApiKey: (key: ApiKey) => void;
  updateApiKey: (id: string, key: Partial<ApiKey>) => void;
  removeApiKey: (id: string) => void;

  // Logs
  requestLogs: ApiRequestLog[];

  // Queries
  queries: SqlQuery[];
  addQuery: (query: SqlQuery) => void;
  updateQuery: (id: string, query: Partial<SqlQuery>) => void;

  // Toast
  toasts: Array<{ id: string; type: 'success' | 'error' | 'info' | 'warning'; message: string }>;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  removeToast: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  darkMode: true,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  connections: mockConnections,
  addConnection: (conn) => set((state) => ({ connections: [...state.connections, conn] })),
  updateConnection: (id, conn) =>
    set((state) => ({
      connections: state.connections.map((c) => (c.id === id ? { ...c, ...conn } : c)),
    })),
  removeConnection: (id) =>
    set((state) => ({ connections: state.connections.filter((c) => c.id !== id) })),

  apis: mockApis,
  addApi: (api) => set((state) => ({ apis: [...state.apis, api] })),
  updateApi: (id, api) =>
    set((state) => ({
      apis: state.apis.map((a) => (a.id === id ? { ...a, ...api } : a)),
    })),
  removeApi: (id) => set((state) => ({ apis: state.apis.filter((a) => a.id !== id) })),

  apiKeys: mockApiKeys,
  addApiKey: (key) => set((state) => ({ apiKeys: [...state.apiKeys, key] })),
  updateApiKey: (id, key) =>
    set((state) => ({
      apiKeys: state.apiKeys.map((k) => (k.id === id ? { ...k, ...key } : k)),
    })),
  removeApiKey: (id) => set((state) => ({ apiKeys: state.apiKeys.filter((k) => k.id !== id) })),

  requestLogs: mockRequestLogs,

  queries: mockQueries,
  addQuery: (query) => set((state) => ({ queries: [...state.queries, query] })),
  updateQuery: (id, query) =>
    set((state) => ({
      queries: state.queries.map((q) => (q.id === id ? { ...q, ...query } : q)),
    })),

  toasts: [],
  addToast: (type, message) =>
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now().toString(), type, message }],
    })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
