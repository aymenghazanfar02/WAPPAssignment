// Registration functionality for StudyValyria platform

document.addEventListener("DOMContentLoaded", () => {
  setupRegistrationForm()
  checkForInterestedCourse()
})

// Setup registration form
function setupRegistrationForm() {
  const registerForm = document.getElementById("registerForm")
  if (!registerForm) return

  registerForm.addEventListener("submit", (e) => {
    e.preventDefault()
    handleRegistration()
  })

  // Real-time validation
  const inputs = registerForm.querySelectorAll("input, select")
  inputs.forEach((input) => {
    input.addEventListener("blur", function () {
      validateField(this)
    })
  })
}

// Handle registration process
function handleRegistration() {
  const formData = getFormData()

  // Validate all fields
  if (!validateRegistrationForm(formData)) {
    return
  }

  // Prepare data for API
  const userData = {
    FirstName: formData.firstName,
    LastName: formData.lastName,
    Email: formData.email,
    Password: formData.password,
    UserType: formData.userType
  }

  // Send to backend
  fetch('http://localhost:51265/api/users/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  })
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => { throw new Error(text) });
    }
    return response.text();
  })
  .then(data => {
    alert('Account created successfully! You can now login.');
    // Redirect based on user type
    redirectAfterRegistration({ ...userData, id: 'temp', registrationDate: new Date().toISOString(), isActive: userData.UserType === 'student', isApproved: userData.UserType === 'student' });
  })
  .catch(error => {
    showError('emailError', error.message || 'Registration failed. Please try again.');
  });
}

// Remove localStorage related functions
// emailExists, createUserAccount, saveUserAccount, generateUserId, hashPassword

// Get form data
function getFormData() {
  return {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    email: document.getElementById("email").value.trim().toLowerCase(),
    password: document.getElementById("password").value,
    confirmPassword: document.getElementById("confirmPassword").value,
    userType: document.getElementById("userType").value,
  }
}

// Validate registration form
function validateRegistrationForm(data) {
  let isValid = true

  // Clear previous errors
  clearAllErrors()

  // Validate first name
  if (data.firstName.length < 2) {
    showError("firstNameError", "First name must be at least 2 characters long.")
    isValid = false
  }

  // Validate last name
  if (data.lastName.length < 2) {
    showError("lastNameError", "Last name must be at least 2 characters long.")
    isValid = false
  }

  // Validate email
  if (!isValidEmail(data.email)) {
    showError("emailError", "Please enter a valid email address.")
    isValid = false
  }

  // Validate password
  if (!isValidPassword(data.password)) {
    showError(
      "passwordError",
      "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
    )
    isValid = false
  }

  // Validate password confirmation
  if (data.password !== data.confirmPassword) {
    showError("confirmPasswordError", "Passwords do not match.")
    isValid = false
  }

  // Validate user type
  if (!data.userType) {
    showError("userTypeError", "Please select your role.")
    isValid = false
  }

  return isValid
}

// Validate individual field
async function validateField(field) {
  const fieldName = field.name
  const value = field.value.trim()
  const errorElementId = fieldName + "Error"

  clearError(errorElementId)

  switch (fieldName) {
    case "firstName":
    case "lastName":
      if (value.length < 2) {
        showError(
          errorElementId,
          `${fieldName === "firstName" ? "First" : "Last"} name must be at least 2 characters long.`,
        )
      }
      break
    case "email":
      if (value && !isValidEmail(value)) {
        showError(errorElementId, "Please enter a valid email address.")
      } else if (value && await emailExists(value)) {
        showError(errorElementId, "An account with this email already exists.")
      }
      break
    case "password":
      if (value && !isValidPassword(value)) {
        showError(
          errorElementId,
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
        )
      }
      break
    case "confirmPassword":
      const password = document.getElementById("password").value
      if (value && value !== password) {
        showError(errorElementId, "Passwords do not match.")
      }
      break
  }
}

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password validation
function isValidPassword(password) {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

// Check if email already exists
async function emailExists(email) {
  try {
    const response = await fetch(`http://localhost:51265/api/users/check-email?email=${encodeURIComponent(email)}`)
    if (response.ok) {
      const result = await response.json()
      return result.exists
    }
    return false
  } catch (error) {
    console.error('Error checking email:', error)
    return false
  }
}









// Redirect after registration
function redirectAfterRegistration(user) {
  // Set current user session
  localStorage.setItem("studyvalyria_current_user", JSON.stringify(user))

  // Redirect based on user type
  setTimeout(() => {
    switch (user.userType) {
      case "student":
        authManager.redirectToDashboard()
        break
      case "educator":
        alert("Your educator account is pending approval. You will be notified once approved.")
        authManager.redirectToLogin()
        break
      default:
        authManager.redirectToLogin()
    }
  }, 1000)
}

// Check for interested course from guest browsing
function checkForInterestedCourse() {
  const interestedCourse = localStorage.getItem("interestedCourse")
  if (interestedCourse) {
    const course = JSON.parse(interestedCourse)
    const message = document.createElement("div")
    message.style.cssText =
      "background: #e8f5e8; padding: 1rem; margin-bottom: 1rem; border-radius: 5px; border-left: 4px solid #27ae60;"
    message.innerHTML = `<strong>Great choice!</strong> After registration, you'll be able to enroll in "${course.title}".`

    const formContainer = document.querySelector(".form-container")
    formContainer.insertBefore(message, formContainer.firstChild)
  }
}

// Utility functions for error handling
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId)
  if (errorElement) {
    errorElement.textContent = message
    errorElement.style.display = "block"
  }
}

function clearError(elementId) {
  const errorElement = document.getElementById(elementId)
  if (errorElement) {
    errorElement.textContent = ""
    errorElement.style.display = "none"
  }
}

function clearAllErrors() {
  const errorElements = document.querySelectorAll(".error-message")
  errorElements.forEach((element) => {
    element.textContent = ""
    element.style.display = "none"
  })
}
