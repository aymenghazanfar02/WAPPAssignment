// Guest functionality for StudyValyria platform

// Initialize page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  loadCourses()
  setupContactForm()
  setupSmoothScrolling()
})

let coursesData = [];

// Load and display courses
async function loadCourses() {
  const coursesGrid = document.getElementById("coursesGrid")
  if (!coursesGrid) return

  try {
    const response = await fetch('http://localhost:51264/api/courses');
    if (!response.ok) throw new Error('Failed to fetch courses');
    coursesData = await response.json();
    displayCourses(coursesData);
  } catch (error) {
    console.error('Error fetching courses:', error);
    coursesGrid.innerHTML = '<p>Error loading courses. Please try again later.</p>';
  }
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
    const response = await fetch('http://localhost:51264/api/contact', {
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

// Export functions for use in other scripts
window.StudyValyriaGuest = {
  searchCourses,
  filterCoursesByLevel,
  getCourseById,
  coursesData,
}
