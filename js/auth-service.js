// Frontend Authentication Service
class AuthService {
  constructor() {
    this.apiUrl = 'http://localhost:5000';
    this.user = null;
    this.token = this.getStoredToken();
  }

  // Store token in localStorage
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Get stored token from localStorage
  getStoredToken() {
    return localStorage.getItem('authToken');
  }

  // Clear token
  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // Get current user info
  async getCurrentUser() {
    try {
      if (!this.token) {
        return null;
      }

      const response = await fetch(`${this.apiUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        this.clearToken();
        return null;
      }

      this.user = await response.json();
      return this.user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      if (!this.token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.apiUrl}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(updates) {
    try {
      if (!this.token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.apiUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  }

  // Login with Google
  loginWithGoogle() {
    window.location.href = `${this.apiUrl}/auth/google`;
  }

  // Logout
  async logout() {
    try {
      await fetch(`${this.apiUrl}/auth/logout`, {
        method: 'GET',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      this.clearToken();
      this.user = null;
      window.location.href = '/index.html';
    }
  }

  // Get user wishlist
  async getWishlist() {
    try {
      if (!this.token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.apiUrl}/auth/wishlist`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return { wishlist: [] };
    }
  }

  // Add game to wishlist
  async addToWishlist(gameId) {
    try {
      if (!this.token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.apiUrl}/auth/wishlist/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gameId }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to add to wishlist');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return null;
    }
  }

  // Remove game from wishlist
  async removeFromWishlist(gameId) {
    try {
      if (!this.token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.apiUrl}/auth/wishlist/remove`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gameId }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to remove from wishlist');
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return null;
    }
  }

  // Handle login token from URL (after Google OAuth callback)
  handleLoginCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      this.setToken(token);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
    return false;
  }
}

// Create global instance
const authService = new AuthService();
