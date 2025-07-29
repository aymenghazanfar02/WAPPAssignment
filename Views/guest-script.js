// Guest functionality for StudyValyria platform

// Initialize page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  loadCourses()
  checkAuthenticationState()
  setupContactForm()
  setupSmoothScrolling()
  
  // Add login form event listener
  const loginForm = document.getElementById('loginForm')
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin)
  }
})

let coursesData = [];

// Load and display courses
async function loadCourses() {
  const coursesGrid = document.getElementById("coursesGrid")
  if (!coursesGrid) return

  const ports = [51265, 51264];
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}/api/courses`);
      if (!response.ok) throw new Error(`Failed to fetch courses from port ${port}`);
      coursesData = await response.json();
      displayCourses(coursesData);
      return; // Success, exit the function
    } catch (error) {
      console.warn(`Error fetching courses from port ${port}:`, error);
    }
  }
  
  // If all ports failed
  console.error('Error fetching courses: All API endpoints failed');
  coursesGrid.innerHTML = '<p>Error loading courses. Please try again later.</p>';
}

function displayCourses(courses) {
  const coursesGrid = document.getElementById("coursesGrid");
  coursesGrid.innerHTML = "";
  courses.forEach((course) => {
    const card = createCourseCard(course);
    coursesGrid.appendChild(card);
  });
}

// Update createCourseCard to use available fields
function createCourseCard(course) {
  const card = document.createElement("div")
  card.className = "course-card"
  card.innerHTML = `
    <h3>${course.Title}</h3>
    <p>${course.Description}</p>
    <button onclick="handleCourseInterest(${course.CourseId})" class="cta-button" style="margin-top: 1rem; padding: 0.5rem 1rem; font-size: 0.9rem;">
      Learn More
    </button>
  `;
  return card
}

// Update handleCourseInterest
function handleCourseInterest(courseId) {
  const course = coursesData.find((c) => c.CourseId === courseId)
  if (course) {
    const userChoice = confirm(
      `Interested in "${course.Title}"? You need to register to enroll. Would you like to go to the registration page?`,
    )
    if (userChoice) {
      localStorage.setItem("interestedCourse", JSON.stringify(course))
      window.location.href = "register.html"
    }
  }
}

// Update searchCourses
function searchCourses(searchTerm) {
  const filteredCourses = coursesData.filter(
    (course) =>
      course.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.Description.toLowerCase().includes(searchTerm.toLowerCase()),
  )
  displayFilteredCourses(filteredCourses)
}

// Update filterCoursesByLevel if needed, but since level not in backend, perhaps remove or adjust

// Remove sampleCourses

// Setup contact form
function setupContactForm() {
  const contactForm = document.getElementById("contactForm")
  if (!contactForm) return

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault()
    handleContactSubmission()
  })
}

// Handle contact form submission
async function handleContactSubmission() {
  const name = document.getElementById("contactName").value.trim()
  const email = document.getElementById("contactEmail").value.trim()
  const message = document.getElementById("contactMessage").value.trim()

  // Validate form
  if (!validateContactForm(name, email, message)) {
    return
  }

  const contactData = {
    name: name,
    email: email,
    message: message,
    timestamp: new Date().toISOString(),
  }

  try {
    // Send contact submission to backend
    const response = await fetch('http://localhost:51265/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    })

    if (response.ok) {
      // Show success message
      alert("Thank you for your message! We will get back to you soon.")
      // Reset form
      document.getElementById("contactForm").reset()
    } else {
      throw new Error('Failed to submit contact form')
    }
  } catch (error) {
    console.error('Error submitting contact form:', error)
    alert("Sorry, there was an error submitting your message. Please try again later.")
  }
}

// Validate contact form
function validateContactForm(name, email, message) {
  if (name.length < 2) {
    alert("Please enter a valid name (at least 2 characters).")
    return false
  }

  if (!isValidEmail(email)) {
    alert("Please enter a valid email address.")
    return false
  }

  if (message.length < 10) {
    alert("Please enter a message with at least 10 characters.")
    return false
  }

  return true
}

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Setup smooth scrolling
function setupSmoothScrolling() {
  const navLinks = document.querySelectorAll('a[href^="#"]')
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const targetId = this.getAttribute("href").substring(1)
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })
}

// Scroll to courses section
function scrollToCourses() {
  const coursesSection = document.getElementById("courses")
  if (coursesSection) {
    coursesSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }
}



// Display filtered courses
function displayFilteredCourses(courses) {
  const coursesGrid = document.getElementById("coursesGrid")
  if (!coursesGrid) return

  coursesGrid.innerHTML = ""

  if (courses.length === 0) {
    coursesGrid.innerHTML =
      '<p style="text-align: center; grid-column: 1 / -1;">No courses found matching your search.</p>'
    return
  }

  courses.forEach((course) => {
    const courseCard = createCourseCard(course)
    coursesGrid.appendChild(courseCard)
  })
}

// Filter courses by level
function filterCoursesByLevel(level) {
  if (level === "all") {
    displayCourses(coursesData)
    return
  }

  const filteredCourses = coursesData.filter((course) => 
    course.Level && course.Level.toLowerCase() === level.toLowerCase()
  )

  displayFilteredCourses(filteredCourses)
}

// Utility function to get course by ID
function getCourseById(courseId) {
  return coursesData.find((course) => course.CourseId === courseId)
}

// Check authentication state and update navigation
function checkAuthenticationState() {
  const currentUser = localStorage.getItem("studyvalyria_current_user")
  
  if (currentUser) {
    try {
      const user = JSON.parse(currentUser)
      updateNavigationForLoggedInUser(user)
    } catch (error) {
      console.error('Error parsing user data:', error)
      localStorage.removeItem("studyvalyria_current_user")
    }
  }
}

// Update navigation for logged in user
function updateNavigationForLoggedInUser(user) {
  const loginBtn = document.getElementById("loginBtn")
  const registerBtn = document.getElementById("registerBtn")
  const dashboardBtn = document.getElementById("dashboardBtn")
  const signoutBtn = document.getElementById("signoutBtn")
  
  if (loginBtn) loginBtn.style.display = "none"
  if (registerBtn) registerBtn.style.display = "none"
  if (dashboardBtn) {
    dashboardBtn.style.display = "block"
    dashboardBtn.addEventListener("click", (e) => {
      e.preventDefault()
      redirectToDashboard(user)
    })
  }
  if (signoutBtn) {
    signoutBtn.style.display = "block"
    signoutBtn.addEventListener("click", (e) => {
      e.preventDefault()
      handleSignOut()
    })
  }
}

// Redirect to appropriate dashboard based on user role
function redirectToDashboard(user) {
  authManager.redirectToDashboard()
}

// Handle sign out
function handleSignOut() {
  localStorage.removeItem("studyvalyria_current_user")
  alert("You have been signed out successfully.")
  window.location.reload()
}

// Modal functions
function openLoginModal() {
  const modal = document.getElementById('loginModal')
  if (modal) {
    // Force reflow for Chrome compatibility
    modal.style.display = 'none'
    modal.offsetHeight // Force reflow
    
    modal.classList.add('show')
    modal.style.display = 'flex'
    document.body.classList.add('modal-open')
    clearLoginForm()
    clearErrors()
    
    // Additional Chrome fix - ensure proper positioning
    setTimeout(() => {
      modal.style.alignItems = 'center'
      modal.style.justifyContent = 'center'
    }, 0)
  }
}

function closeLoginModal() {
  const modal = document.getElementById('loginModal')
  modal.classList.remove('show')
  modal.style.display = 'none'
  document.body.classList.remove('modal-open')
  clearLoginForm()
}

function clearLoginForm() {
  document.getElementById('loginEmail').value = ''
  document.getElementById('loginPassword').value = ''
  clearErrors()
}

function clearErrors() {
  document.getElementById('emailError').textContent = ''
  document.getElementById('passwordError').textContent = ''
}

// Login form submission
function handleLogin(event) {
  event.preventDefault()
  
  const email = document.getElementById('loginEmail').value.trim()
  const password = document.getElementById('loginPassword').value
  
  if (!validateLoginForm(email, password)) {
    return
  }
  
  const loginData = { email, password }
  
  fetch('http://localhost:51265/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(loginData)
  })
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => { throw new Error(text) })
    }
    return response.json()
  })
  .then(data => {
    localStorage.setItem('studyvalyria_current_user', JSON.stringify(data))
    closeLoginModal()
    updateNavigationForLoggedInUser(data)
    showSuccessMessage('Login successful!')
    
    // Redirect to appropriate dashboard using auth manager
    setTimeout(() => {
      if (window.authManager) {
        authManager.redirectToDashboard()
      } else {
        // Fallback redirection if auth manager not available
        const userType = data.UserType || data.userType
        if (userType === 'student') {
          window.location.href = '/Views/student-dashboard.html'
        } else if (userType === 'educator') {
          window.location.href = '/Views/educator-dashboard.html'
        } else if (userType === 'admin') {
          window.location.href = '/Views/admin-dashboard.html'
        }
      }
    }, 1500)
  })
  .catch(error => {
    showError('passwordError', error.message || 'Invalid email or password.')
  })
}

// Validate login form
function validateLoginForm(email, password) {
  let isValid = true
  
  if (!email) {
    showError('emailError', 'Email is required.')
    isValid = false
  } else if (!isValidEmail(email)) {
    showError('emailError', 'Please enter a valid email address.')
    isValid = false
  }
  
  if (!password) {
    showError('passwordError', 'Password is required.')
    isValid = false
  }
  
  return isValid
}

// Show error message
function showError(elementId, message) {
  document.getElementById(elementId).textContent = message
}

// Show success message
function showSuccessMessage(message) {
  // Create a temporary success message
  const successDiv = document.createElement('div')
  successDiv.textContent = message
  successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 10px 20px; border-radius: 5px; z-index: 1001;'
  document.body.appendChild(successDiv)
  
  setTimeout(() => {
    document.body.removeChild(successDiv)
  }, 3000)
}

// Fill demo credentials
function fillDemoCredentials(userType) {
  const credentials = {
    student: { email: 'student@demo.com', password: 'password123' },
    educator: { email: 'educator@demo.com', password: 'password123' },
    admin: { email: 'admin@demo.com', password: 'password123' }
  }
  
  const cred = credentials[userType]
  if (cred) {
    document.getElementById('loginEmail').value = cred.email
    document.getElementById('loginPassword').value = cred.password
  }
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('loginModal')
  if (event.target === modal) {
    closeLoginModal()
  }
}

// Export functions for use in other scripts
window.StudyValyriaGuest = {
  searchCourses,
  filterCoursesByLevel,
  getCourseById,
  coursesData,
  checkAuthenticationState,
  handleSignOut,
  openLoginModal,
  closeLoginModal,
  handleLogin,
  fillDemoCredentials
}
