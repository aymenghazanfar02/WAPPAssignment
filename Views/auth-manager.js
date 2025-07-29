// StudyValyria Authentication State Manager
// Centralized authentication and role-based access control

class AuthManager {
  constructor() {
    this.storageKey = 'studyvalyria_current_user';
    this.currentUser = null;
    this.init();
  }

  // Initialize authentication manager
  init() {
    this.loadUserFromStorage();
    this.setupStorageListener();
  }

  // Load user from localStorage
  loadUserFromStorage() {
    try {
      const userData = localStorage.getItem(this.storageKey);
      if (userData) {
        this.currentUser = JSON.parse(userData);
        this.normalizeUserData();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      this.clearUser();
    }
  }

  // Normalize user data to handle inconsistencies
  normalizeUserData() {
    if (!this.currentUser) return;

    // Normalize property names
    if (this.currentUser.UserType && !this.currentUser.userType) {
      this.currentUser.userType = this.currentUser.UserType.toLowerCase();
    }
    if (this.currentUser.UserId && !this.currentUser.id) {
      this.currentUser.id = this.currentUser.UserId;
    }
    if (this.currentUser.UserId && !this.currentUser.userId) {
      this.currentUser.userId = this.currentUser.UserId;
    }
    if (this.currentUser.userId && !this.currentUser.id) {
      this.currentUser.id = this.currentUser.userId;
    }
    if (this.currentUser.FirstName && !this.currentUser.firstName) {
      this.currentUser.firstName = this.currentUser.FirstName;
    }
    if (this.currentUser.LastName && !this.currentUser.lastName) {
      this.currentUser.lastName = this.currentUser.LastName;
    }
    if (this.currentUser.Email && !this.currentUser.email) {
      this.currentUser.email = this.currentUser.Email;
    }

    // Note: Do not call saveUser here to avoid infinite recursion
    // saveUser already calls normalizeUserData
  }

  // Setup storage event listener for cross-tab synchronization
  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey) {
        this.loadUserFromStorage();
        this.onAuthStateChange();
      }
    });
  }

  // Save user to localStorage
  saveUser(userData) {
    try {
      this.currentUser = userData;
      this.normalizeUserData();
      localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));
      this.onAuthStateChange();
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Clear user data
  clearUser() {
    this.currentUser = null;
    localStorage.removeItem(this.storageKey);
    this.onAuthStateChange();
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.currentUser !== null;
  }

  // Check if user has specific role
  hasRole(role) {
    if (!this.isLoggedIn()) return false;
    return this.currentUser.userType === role.toLowerCase();
  }

  // Check if user can access specific page
  canAccessPage(requiredRole) {
    if (!this.isLoggedIn()) return false;
    if (!requiredRole) return true; // Public page
    return this.hasRole(requiredRole);
  }

  // Redirect to appropriate dashboard based on user role
  redirectToDashboard() {
    if (!this.isLoggedIn()) {
      this.redirectToLogin();
      return;
    }

    const userType = this.currentUser.userType;
    switch (userType) {
      case 'student':
        window.location.href = 'student-dashboard.html';
        break;
      case 'educator':
        window.location.href = 'educator-dashboard.html';
        break;
      case 'admin':
        window.location.href = 'admin-dashboard.html';
        break;
      default:
        window.location.href = 'index.html';
    }
  }

  // Redirect to login page
  redirectToLogin() {
    window.location.href = 'login.html';
  }

  // Redirect to index page
  redirectToIndex() {
    window.location.href = 'index.html';
  }

  // Protect page with role-based access control
  protectPage(requiredRole, showAlert = true) {
    if (!this.isLoggedIn()) {
      if (showAlert) {
        alert('Please log in to access this page.');
      }
      this.redirectToLogin();
      return false;
    }

    if (requiredRole && !this.hasRole(requiredRole)) {
      if (showAlert) {
        alert(`Access denied. This page requires ${requiredRole} privileges.`);
      }
      this.redirectToDashboard();
      return false;
    }

    return true;
  }

  // Logout user
  logout(showConfirm = true) {
    if (showConfirm) {
      const confirmLogout = confirm('Are you sure you want to logout?');
      if (!confirmLogout) return false;
    }

    this.clearUser();
    this.redirectToIndex();
    return true;
  }

  // Refresh user data from backend
  async refreshUserData() {
    if (!this.isLoggedIn()) return null;

    try {
      const response = await fetch(`http://localhost:51265/api/users/${this.currentUser.id}`);
      if (response.ok) {
        const userData = await response.json();
        this.saveUser(userData);
        return userData;
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
    return null;
  }

  // Event handler for authentication state changes
  onAuthStateChange() {
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('authStateChange', {
      detail: {
        user: this.currentUser,
        isLoggedIn: this.isLoggedIn()
      }
    }));
  }

  // Add navigation update for logged in users
  updateNavigation() {
    if (typeof updateNavigationForLoggedInUser === 'function' && this.isLoggedIn()) {
      updateNavigationForLoggedInUser(this.currentUser);
    }
  }
}

// Create global instance
const authManager = new AuthManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthManager;
}

// Global helper functions for backward compatibility
function getCurrentUser() {
  return authManager.getCurrentUser();
}

function isLoggedIn() {
  return authManager.isLoggedIn();
}

function logout() {
  return authManager.logout();
}

function protectPage(requiredRole) {
  return authManager.protectPage(requiredRole);
}

function redirectToDashboard() {
  return authManager.redirectToDashboard();
}