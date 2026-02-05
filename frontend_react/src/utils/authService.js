/**
 * Authentication service for Aegis Dashboard
 * Handles login, registration, and token management
 */

const API_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:5000';

class AuthService {
  constructor() {
    this.token = null;
    this.user = null;
  }

  /**
   * Register a new user
   */
  async register(name, email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Return the backend error message
        return { 
          success: false, 
          error: data.message || 'Registration failed. Please try again.'
        };
      }

      // Store token and user info
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('aegis_token', data.token);
      localStorage.setItem('aegis_user', JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch {
      // Network error or other unexpected error
      return { 
        success: false, 
        error: 'Unable to reach the server. Please try again.'
      };
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Return the backend error message
        return { 
          success: false, 
          error: data.message || 'Login failed. Please try again.'
        };
      }

      // Store token and user info
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('aegis_token', data.token);
      localStorage.setItem('aegis_user', JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch {
      // Network error or other unexpected error
      return { 
        success: false, 
        error: 'Unable to reach the server. Please try again.'
      };
    }
  }

  /**
   * Logout user
   */
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('aegis_token');
    localStorage.removeItem('aegis_user');
  }

  /**
   * Get current user from backend (validates token)
   */
  async getCurrentUser() {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'No token found' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Token is invalid, clear it
        this.logout();
        throw new Error(data.message || 'Authentication failed');
      }

      this.user = data.user;
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get stored token
   */
  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('aegis_token');
    }
    return this.token;
  }

  /**
   * Get stored user
   */
  getUser() {
    if (!this.user) {
      const userStr = localStorage.getItem('aegis_user');
      if (userStr) {
        try {
          this.user = JSON.parse(userStr);
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
    }
    return this.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  }
}

// Export singleton instance
export default new AuthService();
