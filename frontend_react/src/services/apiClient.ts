/**
 * API Client - Single service layer for all API calls
 * Provides consistent error handling, loading states, and data transformation
 */

import { errorHandler } from '../utils/errorHandler';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Use default error message if parsing fails
        }

        throw new Error(errorMessage);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        return {} as T;
      }

      const data = await response.json();
      return this.transformResponse<T>(data);
    } catch (error) {
      const handledError = errorHandler.handleError(
        error as Error,
        { endpoint, method: options.method || 'GET' }
      );
      throw handledError;
    }
  }

  private transformResponse<T>(data: any): T {
    // Handle different response formats
    if (data && typeof data === 'object') {
      // If response has a 'data' property, extract it
      if ('data' in data) {
        return data.data;
      }
      // If response has 'results' property (pagination), extract it
      if ('results' in data) {
        return data.results;
      }
    }
    
    return data;
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'GET',
    });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Create singleton instance
const getBaseUrl = () => {
  // Check if we're in development mode
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }
  return '';
};

export const apiClient = new ApiClient(getBaseUrl());