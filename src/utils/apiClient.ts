/**
 * Fetch with timeout wrapper
 * Prevents requests from hanging indefinitely
 */
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeout = 30000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      }
    }
    throw error;
  }
}

/**
 * API client with timeout and error handling
 */
export class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://localhost:3001', timeout: number = 30000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetchWithTimeout(url.toString(), {}, this.timeout);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      },
      this.timeout
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}${endpoint}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      },
      this.timeout
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}${endpoint}`,
      {
        method: 'DELETE',
      },
      this.timeout
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }
}

// Export default API client instance
export const apiClient = new ApiClient();
