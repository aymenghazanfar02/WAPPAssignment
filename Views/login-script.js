// Login functionality for StudyValyria platform

document.addEventListener("DOMContentLoaded", () => {
  setupLoginForm()
})

// Setup login form
function setupLoginForm() {
  const loginForm = document.getElementById("loginForm")
  if (!loginForm) return

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault()
    handleLogin()
  })
}

// Handle login process
function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim().toLowerCase()
  const password = document.getElementById("loginPassword").value

  // Clear previous errors
  clearAllErrors()

  // Validate inputs
  if (!validateLoginForm(email, password)) {
    return
  }

  // Send to backend
  fetch('http://localhost:51264/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ Email: email, Password: password })
  })
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => { throw new Error(text) });
    }
    return response.json();
  })
  .then(data => {
    // Store user session
    localStorage.setItem("studyvalyria_current_user", JSON.stringify(data));
    showSuccess("Login successful! Redirecting...");
    // Redirect
    redirectToDashboard(data);
  })
  .catch(error => {
    showError('passwordError', error.message || 'Invalid email or password.');
  });
}

// Validate login form
function validateLoginForm(email, password) {
  let isValid = true

  if (!email) {
    showError("emailError", "Email is required.")
    isValid = false
  } else if (!isValidEmail(email)) {
    showError("emailError", "Please enter a valid email address.")
    isValid = false
  }

  if (!password) {
    showError("passwordError", "Password is required.")
    isValid = false
  }

  return isValid
}

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Redirect to appropriate dashboard
function redirectToDashboard(user) {
  setTimeout(() => {
    switch (user.userType) {
      case "student":
        window.location.href = "student-dashboard.html"
        break
      case "educator":
        window.location.href = "educator-dashboard.html"
        break
      case "admin":
        window.location.href = "admin-dashboard.html"
        break
      default:
        window.location.href = "index.html"
    }
  }, 1000)
}

// Demo accounts are now managed by the backend
// No need to create them in localStorage

// Fill demo credentials
function fillDemoCredentials(userType) {
  const credentials = {
    student: { email: "student@demo.com", password: "password123" },
    educator: { email: "educator@demo.com", password: "password123" },
    admin: { email: "admin@demo.com", password: "password123" },
  }

  const cred = credentials[userType]
  if (cred) {
    document.getElementById("loginEmail").value = cred.email
    document.getElementById("loginPassword").value = cred.password
  }
}

// Utility functions for error handling
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId)
  if (errorElement) {
    errorElement.textContent = message
    errorElement.style.display = "block"
    errorElement.className = "error-message"
  }
}

function showSuccess(message) {
  // Create or update success message
  let successElement = document.getElementById("successMessage")
  if (!successElement) {
    successElement = document.createElement("div")
    successElement.id = "successMessage"
    successElement.className = "success-message"
    successElement.style.cssText =
      "text-align: center; margin-top: 1rem; padding: 0.5rem; background: #d4edda; color: #155724; border-radius: 5px;"
    document.querySelector(".form-container").appendChild(successElement)
  }
  successElement.textContent = message
  successElement.style.display = "block"
}

function clearAllErrors() {
  const errorElements = document.querySelectorAll(".error-message")
  errorElements.forEach((element) => {
    element.textContent = ""
    element.style.display = "none"
  })

  const successElement = document.getElementById("successMessage")
  if (successElement) {
    successElement.style.display = "none"
  }
}
