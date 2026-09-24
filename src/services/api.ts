import { DatabaseConnection, ApiDefinition, ApiKey, ApiRequestLog, SqlQuery } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

// Database Connections API
export const connectionsApi = {
  getAll: async (): Promise<DatabaseConnection[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/connections`);
      if (!response.ok) throw new Error('Failed to fetch connections');
      const data = await response.json();
      return data.connections || [];
    } catch (error) {
      console.error('Error fetching connections:', error);
      return [];
    }
  },

  create: async (connection: Partial<DatabaseConnection>): Promise<DatabaseConnection | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connection),
      });
      if (!response.ok) throw new Error('Failed to create connection');
      const data = await response.json();
      return data.connection;
    } catch (error) {
      console.error('Error creating connection:', error);
      return null;
    }
  },

  test: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/connections/${id}/test`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Connection test failed');
      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/connections/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete connection');
      return true;
    } catch (error) {
      console.error('Error deleting connection:', error);
      return false;
    }
  },
};

// APIs API
export const apisApi = {
  getAll: async (): Promise<ApiDefinition[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/apis`);
      if (!response.ok) throw new Error('Failed to fetch APIs');
      const data = await response.json();
      return data.apis || [];
    } catch (error) {
      console.error('Error fetching APIs:', error);
      return [];
    }
  },

  create: async (api: Partial<ApiDefinition>): Promise<ApiDefinition | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/apis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(api),
      });
      if (!response.ok) throw new Error('Failed to create API');
      const data = await response.json();
      return data.api;
    } catch (error) {
      console.error('Error creating API:', error);
      return null;
    }
  },

  update: async (id: string, api: Partial<ApiDefinition>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/apis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(api),
      });
      if (!response.ok) throw new Error('Failed to update API');
      return true;
    } catch (error) {
      console.error('Error updating API:', error);
      return false;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/apis/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete API');
      return true;
    } catch (error) {
      console.error('Error deleting API:', error);
      return false;
    }
  },
};

// API Keys API
export const apiKeysApi = {
  getAll: async (): Promise<ApiKey[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api-keys`);
      if (!response.ok) throw new Error('Failed to fetch API keys');
      const data = await response.json();
      return data.apiKeys || [];
    } catch (error) {
      console.error('Error fetching API keys:', error);
      return [];
    }
  },

  create: async (apiKey: Partial<ApiKey>): Promise<ApiKey | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiKey),
      });
      if (!response.ok) throw new Error('Failed to create API key');
      const data = await response.json();
      return data.apiKey;
    } catch (error) {
      console.error('Error creating API key:', error);
      return null;
    }
  },

  revoke: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api-keys/${id}/revoke`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to revoke API key');
      return true;
    } catch (error) {
      console.error('Error revoking API key:', error);
      return false;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api-keys/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete API key');
      return true;
    } catch (error) {
      console.error('Error deleting API key:', error);
      return false;
    }
  },
};

// Logs API
export const logsApi = {
  getAll: async (): Promise<ApiRequestLog[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/logs`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      return data.logs || [];
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  },
};

// Queries API
export const queriesApi = {
  getAll: async (): Promise<SqlQuery[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/queries`);
      if (!response.ok) throw new Error('Failed to fetch queries');
      const data = await response.json();
      return data.queries || [];
    } catch (error) {
      console.error('Error fetching queries:', error);
      return [];
    }
  },

  create: async (query: Partial<SqlQuery>): Promise<SqlQuery | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      });
      if (!response.ok) throw new Error('Failed to create query');
      const data = await response.json();
      return data.query;
    } catch (error) {
      console.error('Error creating query:', error);
      return null;
    }
  },
};

// Dashboard Metrics API
export const dashboardApi = {
  getMetrics: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/metrics`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      return data.metrics;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return null;
    }
  },

  getChartData: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/chart-data`);
      if (!response.ok) throw new Error('Failed to fetch chart data');
      const data = await response.json();
      return data.chartData;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return null;
    }
  },
};
