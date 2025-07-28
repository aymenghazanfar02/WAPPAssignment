# Frontend Documentation

## Overview

The StudyValyria frontend is a **Single Page Application (SPA)** built with vanilla HTML, CSS, and JavaScript. It provides a responsive, modern interface for the learning management system.

## Technology Stack

- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with Flexbox and Grid
- **Vanilla JavaScript**: Client-side logic and API integration
- **Local Storage**: Client-side data persistence
- **Responsive Design**: Mobile-first approach

## Project Structure

```
Views/
├── index.html              # Landing page
├── login.html              # User authentication
├── register.html           # User registration
├── student-dashboard.html  # Student interface
├── educator-dashboard.html # Educator interface
├── admin-dashboard.html    # Admin interface
├── styles.css              # Global styles
├── login-script.js         # Authentication logic
├── register-script.js      # Registration logic
├── student-script.js       # Student dashboard logic
├── educator-script.js      # Educator dashboard logic
├── admin-script.js         # Admin dashboard logic
├── guest-script.js         # Landing page logic
└── package.json            # Project metadata
```

## Page Components

### 1. Landing Page (index.html)
**Purpose**: Public homepage and course browsing

**Features**:
- Hero section with call-to-action
- Course catalog display
- Navigation menu
- Contact form
- Responsive design

**Key Elements**:
```html
<nav class="navbar">           <!-- Navigation -->
<section class="hero">         <!-- Hero banner -->
<section class="courses">      <!-- Course grid -->
<section class="contact">      <!-- Contact form -->
<footer>                       <!-- Footer -->
```

### 2. Authentication Pages

#### Login Page (login.html)
**Features**:
- Email/password form
- Role-based redirection
- Form validation
- Error handling

#### Registration Page (register.html)
**Features**:
- Multi-step registration
- Role selection (Student/Educator)
- Email validation
- Password strength checking

### 3. Dashboard Pages

#### Student Dashboard (student-dashboard.html)
**Features**:
- Enrolled courses overview
- Course progress tracking
- Quiz taking interface
- Study time analytics
- Profile management

**Key Sections**:
```html
<div class="dashboard-header">     <!-- User info -->
<div class="stats-grid">           <!-- Statistics -->
<div class="courses-section">      <!-- Enrolled courses -->
<div class="quiz-section">         <!-- Available quizzes -->
<div class="activity-feed">        <!-- Recent activities -->
```

#### Educator Dashboard (educator-dashboard.html)
**Features**:
- Course management
- Student enrollment tracking
- Course analytics
- Content creation tools

**Key Sections**:
```html
<div class="dashboard-header">     <!-- Educator info -->
<div class="stats-overview">       <!-- Teaching stats -->
<div class="course-management">    <!-- Course CRUD -->
<div class="student-overview">     <!-- Enrolled students -->
<div class="analytics-section">   <!-- Performance metrics -->
```

#### Admin Dashboard (admin-dashboard.html)
**Features**:
- User management
- System analytics
- Course oversight
- Platform configuration

**Key Sections**:
```html
<div class="admin-header">         <!-- Admin controls -->
<div class="system-stats">         <!-- Platform metrics -->
<div class="user-management">      <!-- User administration -->
<div class="course-oversight">     <!-- Course management -->
<div class="system-logs">          <!-- Activity monitoring -->
```

## CSS Architecture

### Global Styles (styles.css)

#### CSS Variables
```css
:root {
  --primary-color: #3498db;
  --secondary-color: #2c3e50;
  --success-color: #27ae60;
  --warning-color: #f39c12;
  --danger-color: #e74c3c;
  --light-bg: #ecf0f1;
  --dark-text: #2c3e50;
  --border-radius: 8px;
  --box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
```

#### Layout System
```css
/* Flexbox utilities */
.flex { display: flex; }
.flex-column { flex-direction: column; }
.justify-center { justify-content: center; }
.align-center { align-items: center; }

/* Grid utilities */
.grid { display: grid; }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }
```

#### Component Styles
```css
/* Cards */
.card {
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  padding: 1.5rem;
  margin-bottom: 1rem;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
  transform: translateY(-2px);
}
```

### Responsive Design
```css
/* Mobile First Approach */
@media (max-width: 768px) {
  .nav-menu {
    flex-direction: column;
    gap: 1rem;
  }
  
  .grid-3 {
    grid-template-columns: 1fr;
  }
  
  .hero-content h1 {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 1rem;
  }
  
  .card {
    padding: 1rem;
  }
}
```

## JavaScript Architecture

### Common Patterns

#### API Communication
```javascript
// Base API configuration
const API_BASE = 'http://localhost:51264/api';

// Generic API call function
async function apiCall(endpoint, method = 'GET', data = null) {
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
```

#### Local Storage Management
```javascript
// User session management
const SessionManager = {
    setUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    },
    
    getUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },
    
    clearUser() {
        localStorage.removeItem('currentUser');
    },
    
    isLoggedIn() {
        return this.getUser() !== null;
    }
};
```

#### Form Validation
```javascript
// Generic form validation
function validateForm(formData, rules) {
    const errors = {};
    
    for (const [field, rule] of Object.entries(rules)) {
        const value = formData[field];
        
        if (rule.required && !value) {
            errors[field] = `${field} is required`;
        }
        
        if (rule.email && value && !isValidEmail(value)) {
            errors[field] = 'Invalid email format';
        }
        
        if (rule.minLength && value && value.length < rule.minLength) {
            errors[field] = `Minimum length is ${rule.minLength}`;
        }
    }
    
    return errors;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
```

### Page-Specific Scripts

#### Authentication (login-script.js)
```javascript
// Login form handling
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const credentials = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    try {
        const user = await apiCall('/auth/login', 'POST', credentials);
        SessionManager.setUser(user);
        redirectToDashboard(user.role);
    } catch (error) {
        showError('Invalid credentials');
    }
});

function redirectToDashboard(role) {
    const dashboards = {
        'Student': 'student-dashboard.html',
        'Educator': 'educator-dashboard.html',
        'Admin': 'admin-dashboard.html'
    };
    
    window.location.href = dashboards[role] || 'index.html';
}
```

#### Dashboard Common Functions
```javascript
// Dashboard initialization
function initializeDashboard() {
    const user = SessionManager.getUser();
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    updateUserInfo(user);
    loadDashboardData(user);
    setupEventListeners();
}

// Dynamic content loading
async function loadDashboardData(user) {
    try {
        showLoading(true);
        
        const [courses, activities, stats] = await Promise.all([
            loadUserCourses(user.userId),
            loadUserActivities(user.userId),
            loadUserStats(user.userId)
        ]);
        
        renderCourses(courses);
        renderActivities(activities);
        renderStats(stats);
        
    } catch (error) {
        showError('Failed to load dashboard data');
    } finally {
        showLoading(false);
    }
}
```

## UI Components

### Modal System
```javascript
// Modal management
const Modal = {
    show(modalId) {
        document.getElementById(modalId).style.display = 'block';
        document.body.style.overflow = 'hidden';
    },
    
    hide(modalId) {
        document.getElementById(modalId).style.display = 'none';
        document.body.style.overflow = 'auto';
    },
    
    confirm(message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            modal.querySelector('.modal-message').textContent = message;
            
            modal.querySelector('.confirm-yes').onclick = () => {
                this.hide('confirmModal');
                resolve(true);
            };
            
            modal.querySelector('.confirm-no').onclick = () => {
                this.hide('confirmModal');
                resolve(false);
            };
            
            this.show('confirmModal');
        });
    }
};
```

### Notification System
```javascript
// Toast notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}
```

### Data Visualization
```javascript
// Simple chart rendering (using Chart.js or similar)
function renderChart(canvasId, data, options) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    return new Chart(ctx, {
        type: options.type || 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            ...options
        }
    });
}

// Usage example
function renderStudyHoursChart(data) {
    renderChart('studyHoursChart', {
        labels: data.labels,
        datasets: [{
            label: 'Study Hours',
            data: data.values,
            backgroundColor: 'rgba(52, 152, 219, 0.8)'
        }]
    }, {
        type: 'line',
        scales: {
            y: {
                beginAtZero: true
            }
        }
    });
}
```

## State Management

### Application State
```javascript
// Global application state
const AppState = {
    user: null,
    courses: [],
    enrollments: [],
    activities: [],
    
    // State updates
    setUser(user) {
        this.user = user;
        this.notifyStateChange('user', user);
    },
    
    setCourses(courses) {
        this.courses = courses;
        this.notifyStateChange('courses', courses);
    },
    
    // Event system for state changes
    listeners: {},
    
    subscribe(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    
    notifyStateChange(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
};
```

## Performance Optimization

### Lazy Loading
```javascript
// Lazy load images
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}
```

### Debouncing
```javascript
// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Usage
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', debounce(handleSearch, 300));
```

## Security Considerations

### Input Sanitization
```javascript
// XSS prevention
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Safe DOM updates
function updateTextContent(elementId, content) {
    const element = document.getElementById(elementId);
    element.textContent = sanitizeHTML(content);
}
```

### CSRF Protection
```javascript
// Add CSRF token to requests
function addCSRFToken(headers = {}) {
    const token = document.querySelector('meta[name="csrf-token"]')?.content;
    if (token) {
        headers['X-CSRF-Token'] = token;
    }
    return headers;
}
```

## Testing

### Unit Testing Example
```javascript
// Simple test framework
function test(description, testFunction) {
    try {
        testFunction();
        console.log(`✓ ${description}`);
    } catch (error) {
        console.error(`✗ ${description}: ${error.message}`);
    }
}

// Test examples
test('SessionManager should store user data', () => {
    const testUser = { id: 1, name: 'Test User' };
    SessionManager.setUser(testUser);
    const retrievedUser = SessionManager.getUser();
    
    if (JSON.stringify(testUser) !== JSON.stringify(retrievedUser)) {
        throw new Error('User data not stored correctly');
    }
});
```

## Browser Compatibility

### Supported Browsers
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

### Polyfills
```javascript
// Fetch polyfill for older browsers
if (!window.fetch) {
    // Load fetch polyfill
    const script = document.createElement('script');
    script.src = 'https://polyfill.io/v3/polyfill.min.js?features=fetch';
    document.head.appendChild(script);
}
```

## Deployment

### Build Process
1. Minify CSS and JavaScript files
2. Optimize images
3. Generate service worker for caching
4. Update cache busting parameters

### CDN Integration
```html
<!-- External libraries -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

## Accessibility

### ARIA Labels
```html
<button aria-label="Close modal" class="close-btn">
    <i class="fas fa-times" aria-hidden="true"></i>
</button>

<nav role="navigation" aria-label="Main navigation">
    <!-- Navigation items -->
</nav>
```

### Keyboard Navigation
```javascript
// Keyboard event handling
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Close any open modals
        const openModal = document.querySelector('.modal[style*="block"]');
        if (openModal) {
            Modal.hide(openModal.id);
        }
    }
});
```

This frontend documentation provides a comprehensive guide to understanding and working with the StudyValyria client-side application.