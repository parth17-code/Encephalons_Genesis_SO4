// Auth utilities for managing JWT tokens and user data

export const authService = {
  // Get token from localStorage
  getToken() {
    return localStorage.getItem('token');
  },

  // Set token in localStorage
  setToken(token) {
    localStorage.setItem('token', token);
  },

  // Get user data from localStorage
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Set user data in localStorage
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  },

  // Get user role
  getUserRole() {
    const user = this.getUser();
    return user ? user.role : null;
  },

  // Logout - clear all auth data
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Save auth data after login
  saveAuthData(token, userData) {
    this.setToken(token);
    this.setUser(userData);
  }
};