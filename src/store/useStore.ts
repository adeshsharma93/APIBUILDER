import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DatabaseConnection, ApiDefinition, ApiKey, ApiRequestLog, SqlQuery } from '../types';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'developer' | 'viewer';
}

interface AppState {
  // Authentication
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;

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
  setConnections: (connections: DatabaseConnection[]) => void;

  // APIs
  apis: ApiDefinition[];
  addApi: (api: ApiDefinition) => void;
  updateApi: (id: string, api: Partial<ApiDefinition>) => void;
  removeApi: (id: string) => void;
  setApis: (apis: ApiDefinition[]) => void;

  // API Keys
  apiKeys: ApiKey[];
  addApiKey: (key: ApiKey) => void;
  updateApiKey: (id: string, key: Partial<ApiKey>) => void;
  removeApiKey: (id: string) => void;
  setApiKeys: (apiKeys: ApiKey[]) => void;

  // Logs
  requestLogs: ApiRequestLog[];
  setRequestLogs: (requestLogs: ApiRequestLog[]) => void;

  // Queries
  queries: SqlQuery[];
  addQuery: (query: SqlQuery) => void;
  updateQuery: (id: string, query: Partial<SqlQuery>) => void;
  setQueries: (queries: SqlQuery[]) => void;

  // Toast
  toasts: Array<{ id: string; type: 'success' | 'error' | 'info' | 'warning'; message: string }>;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  removeToast: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
  // Authentication
  currentUser: null,
  isAuthenticated: false,
  login: (user) => set({ currentUser: user, isAuthenticated: true }),
  logout: () => set({ currentUser: null, isAuthenticated: false }),

  darkMode: true,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  connections: [],
  addConnection: (conn) => set((state) => ({ connections: [...state.connections, conn] })),
  updateConnection: (id, conn) =>
    set((state) => ({
      connections: state.connections.map((c) => (c.id === id ? { ...c, ...conn } : c)),
    })),
  removeConnection: (id) =>
    set((state) => ({ connections: state.connections.filter((c) => c.id !== id) })),
  setConnections: (connections) => set({ connections }),

  apis: [],
  addApi: (api) => set((state) => ({ apis: [...state.apis, api] })),
  updateApi: (id, api) =>
    set((state) => ({
      apis: state.apis.map((a) => (a.id === id ? { ...a, ...api } : a)),
    })),
  removeApi: (id) => set((state) => ({ apis: state.apis.filter((a) => a.id !== id) })),
  setApis: (apis) => set({ apis }),

  apiKeys: [],
  addApiKey: (key) => set((state) => ({ apiKeys: [...state.apiKeys, key] })),
  updateApiKey: (id, key) =>
    set((state) => ({
      apiKeys: state.apiKeys.map((k) => (k.id === id ? { ...k, ...key } : k)),
    })),
  removeApiKey: (id) => set((state) => ({ apiKeys: state.apiKeys.filter((k) => k.id !== id) })),
  setApiKeys: (apiKeys) => set({ apiKeys }),

  requestLogs: [],
  setRequestLogs: (requestLogs) => set({ requestLogs }),

  queries: [],
  addQuery: (query) => set((state) => ({ queries: [...state.queries, query] })),
  updateQuery: (id, query) =>
    set((state) => ({
      queries: state.queries.map((q) => (q.id === id ? { ...q, ...query } : q)),
    })),
  setQueries: (queries) => set({ queries }),

  toasts: [],
  addToast: (type, message) =>
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now().toString(), type, message }],
    })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}),
    {
      name: 'sql-api-builder-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        connections: state.connections,
        apis: state.apis,
        apiKeys: state.apiKeys,
        queries: state.queries,
        darkMode: state.darkMode,
      }),
    }
  )
);
