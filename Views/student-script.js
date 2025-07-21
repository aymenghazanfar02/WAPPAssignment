// Student dashboard functionality for StudyValyria platform

let currentUser = null
let currentSection = "overview"

document.addEventListener("DOMContentLoaded", () => {
  initializeStudentDashboard()
})

// Initialize student dashboard
async function initializeStudentDashboard() {
  // Check if user is logged in and is a student
  currentUser = JSON.parse(localStorage.getItem("studyvalyria_current_user"))

  if (!currentUser || currentUser.userType !== "student") {
    alert("Access denied. Please login as a student.")
    window.location.href = "login.html"
    return
  }

  // Fetch latest user data from backend
  try {
    const response = await fetch(`http://localhost:51264/api/users/${currentUser.id}`);
    if (response.ok) {
      currentUser = await response.json();
      localStorage.setItem("studyvalyria_current_user", JSON.stringify(currentUser));
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }

  // Update welcome message
  document.getElementById("welcomeMessage").textContent = `Welcome, ${currentUser.firstName}!`

  // Load dashboard data
  await loadOverviewData()
  await loadEnrolledCourses()
  await loadAvailableCourses()
  await loadQuizzes()
  loadProfile()
  setupEventListeners()
}

// Setup event listeners
function setupEventListeners() {
  // Course search
  document.getElementById("courseSearch").addEventListener("input", () => {
    filterAvailableCourses()
  })

  // Level filter
  document.getElementById("levelFilter").addEventListener("change", () => {
    filterAvailableCourses()
  })

  // Profile form
  document.getElementById("profileForm").addEventListener("submit", (e) => {
    e.preventDefault()
    updateProfile()
  })
}

// Show specific dashboard section
function showSection(sectionName) {
  // Hide all sections
  const sections = document.querySelectorAll(".dashboard-section")
  sections.forEach((section) => (section.style.display = "none"))

  // Remove active class from all buttons
  const buttons = document.querySelectorAll(".dashboard-nav button")
  buttons.forEach((btn) => btn.classList.remove("active"))

  // Show selected section
  document.getElementById(sectionName + "Section").style.display = "block"
  document.getElementById(sectionName + "Btn").classList.add("active")

  currentSection = sectionName
}

// Load overview data
async function loadOverviewData() {
  const enrolledCourses = await getEnrolledCourses()
  const quizResults = await getQuizResults()

  // Update stats
  document.getElementById("enrolledCoursesCount").textContent = enrolledCourses.length
  document.getElementById("completedQuizzesCount").textContent = quizResults.length

  // Calculate average score
  if (quizResults.length > 0) {
    const totalScore = quizResults.reduce((sum, result) => sum + result.score, 0)
    const averageScore = Math.round(totalScore / quizResults.length)
    document.getElementById("averageScore").textContent = averageScore + "%"
  }

  // Calculate study hours (mock data)
  const studyHours = enrolledCourses.length * 15 // Assume 15 hours per course
  document.getElementById("studyHours").textContent = studyHours

  // Load recent activity (keep mock for now)
  loadRecentActivity()
}

// Load recent activity
function loadRecentActivity() {
  const activities = [
    {
      type: "enrollment",
      message: "Enrolled in Introduction to Web Development",
      date: new Date(Date.now() - 86400000),
    },
    { type: "quiz", message: "Completed JavaScript Basics Quiz - Score: 85%", date: new Date(Date.now() - 172800000) },
    { type: "course", message: "Started Advanced JavaScript course", date: new Date(Date.now() - 259200000) },
  ]

  const activityList = document.getElementById("recentActivityList")
  activityList.innerHTML = ""

  if (activities.length === 0) {
    activityList.innerHTML = "<p>No recent activity</p>"
    return
  }

  activities.forEach((activity) => {
    const activityItem = document.createElement("div")
    activityItem.style.cssText = "padding: 0.5rem 0; border-bottom: 1px solid #eee;"
    activityItem.innerHTML = `
            <p style="margin: 0; font-weight: 500;">${activity.message}</p>
            <small style="color: #666;">${formatDate(activity.date)}</small>
        `
    activityList.appendChild(activityItem)
  })
}

// Load enrolled courses
async function loadEnrolledCourses() {
  const enrolled = await getEnrolledCourses()
  const coursesList = document.getElementById("enrolledCoursesList")

  coursesList.innerHTML = ""

  if (enrolled.length === 0) {
    coursesList.innerHTML =
      '<p style="text-align: center; grid-column: 1 / -1;">You are not enrolled in any courses yet. <a href="#" onclick="showSection(\'browse\')">Browse courses</a> to get started!</p>'
    return
  }

  for (const enrollment of enrolled) {
    const course = await getCourse(enrollment.courseId)
    if (course) {
      const courseCard = createEnrolledCourseCard(course, enrollment)
      coursesList.appendChild(courseCard)
    }
  }
}

// Create enrolled course card
function createEnrolledCourseCard(course, enrollment) {
  const card = document.createElement("div")
  card.className = "course-card"

  const progress = enrollment.progress

  card.innerHTML = `
        <h3>${course.title}</h3>
        <p><strong>Instructor:</strong> ${course.educatorId}</p> // Note: Fetch instructor name if needed
        <p><strong>Duration:</strong> ${course.duration}</p>
        <div style="margin: 1rem 0;">
            <div style="background: #f0f0f0; border-radius: 10px; overflow: hidden;">
                <div style="background: #3498db; height: 10px; width: ${progress}%; transition: width 0.3s;"></div>
            </div>
            <small>Progress: ${progress}%</small>
        </div>
        <button onclick="viewCourse(${course.courseId})" class="cta-button" style="margin-top: 1rem; padding: 0.5rem 1rem; font-size: 0.9rem;">
            Continue Learning
        </button>
        <button onclick="unenrollFromCourse(${enrollment.enrollmentId})" style="margin-left: 0.5rem; padding: 0.5rem 1rem; font-size: 0.9rem; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Unenroll
        </button>
    `

  return card
}

// Load available courses
async function loadAvailableCourses() {
  const allCourses = await getAllCourses()
  const enrolledCourseIds = (await getEnrolledCourses()).map((en) => en.courseId)
  const availableCourses = allCourses.filter((course) => !enrolledCourseIds.includes(course.courseId))

  displayAvailableCourses(availableCourses)
}

// Display available courses
function displayAvailableCourses(courses) {
  const coursesList = document.getElementById("availableCoursesList")
  coursesList.innerHTML = ""

  if (courses.length === 0) {
    coursesList.innerHTML =
      '<p style="text-align: center; grid-column: 1 / -1;">No courses available matching your criteria.</p>'
    return
  }

  courses.forEach((course) => {
    const courseCard = createAvailableCourseCard(course)
    coursesList.appendChild(courseCard)
  })
}

// Create available course card
function createAvailableCourseCard(course) {
  const card = document.createElement("div")
  card.className = "course-card"

  card.innerHTML = `
        <h3>${course.title}</h3>
        <p><strong>Instructor:</strong> ${course.educatorId}</p> // Note: Fetch name if needed
        <p><strong>Duration:</strong> ${course.duration}</p>
        <p><strong>Level:</strong> ${course.level}</p>
        <p>${course.description}</p>
        <div class="course-price">$${course.price}</div>
        <button onclick="enrollInCourse(${course.courseId})" class="cta-button" style="margin-top: 1rem; padding: 0.5rem 1rem; font-size: 0.9rem;">
            Enroll Now
        </button>
    `

  return card
}

// Filter available courses
async function filterAvailableCourses() {
  const searchTerm = document.getElementById("courseSearch").value.toLowerCase()
  const levelFilter = document.getElementById("levelFilter").value

  const allCourses = await getAllCourses()
  const enrolledCourseIds = (await getEnrolledCourses()).map((en) => en.courseId)
  let availableCourses = allCourses.filter((course) => !enrolledCourseIds.includes(course.courseId))

  // Apply search filter
  if (searchTerm) {
    availableCourses = availableCourses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm) ||
        course.educatorId.toString().includes(searchTerm),
    )
  }

  // Apply level filter
  if (levelFilter !== "all") {
    availableCourses = availableCourses.filter((course) => course.level.toLowerCase() === levelFilter)
  }

  displayAvailableCourses(availableCourses)
}

// Enroll in course
async function enrollInCourse(courseId) {
  const course = await getCourse(courseId)
  if (!course) return

  const confirmEnrollment = confirm(`Are you sure you want to enroll in "${course.title}" for $${course.price}?`)
  if (!confirmEnrollment) return

  try {
    const response = await fetch("http://localhost:51264/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.userId, courseId: courseId }),
    });

    if (response.ok) {
      alert(`Successfully enrolled in "${course.title}"!`)
      // Refresh displays
      await loadOverviewData()
      await loadEnrolledCourses()
      await loadAvailableCourses()
      await loadQuizzes()
    } else {
      alert("Enrollment failed. Please try again.")
    }
  } catch (error) {
    console.error("Error enrolling:", error)
    alert("An error occurred during enrollment.")
  }
}

// Unenroll from course
async function unenrollFromCourse(enrollmentId) {
  const confirmUnenrollment = confirm(`Are you sure you want to unenroll from this course?`)
  if (!confirmUnenrollment) return

  try {
    const response = await fetch(`http://localhost:51264/api/enrollments/${enrollmentId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      alert(`Successfully unenrolled from the course.`)
      // Refresh displays
      await loadOverviewData()
      await loadEnrolledCourses()
      await loadAvailableCourses()
      await loadQuizzes()
    } else {
      alert("Unenrollment failed. Please try again.")
    }
  } catch (error) {
    console.error("Error unenrolling:", error)
    alert("An error occurred during unenrollment.")
  }
}

// View course details
async function viewCourse(courseId) {
  const course = await getCourse(courseId)
  if (!course) return

  alert(
    `Viewing course: ${course.title}\n\nThis would typically open the course content page with lessons, materials, and assignments.`,
  )
}

// Load quizzes
async function loadQuizzes() {
  const enrolledCourses = await getEnrolledCourses()
  const quizResults = await getQuizResults()
  const quizzesList = document.getElementById("quizzesList")

  quizzesList.innerHTML = ""

  if (enrolledCourses.length === 0) {
    quizzesList.innerHTML = "<p>Enroll in courses to access quizzes and assessments.</p>"
    return
  }

  for (const enrollment of enrolledCourses) {
    const course = await getCourse(enrollment.courseId)
    if (course) {
      const courseResults = quizResults.filter((r) => r.courseId === course.courseId)
      const quizCard = createQuizCard(course, courseResults)
      quizzesList.appendChild(quizCard)
    }
  }
}

// Create quiz card
function createQuizCard(course, results) {
  const card = document.createElement("div")
  card.className = "course-card"
  card.style.marginBottom = "1rem"

  const hasAttempted = results.length > 0
  const bestScore = hasAttempted ? Math.max(...results.map((r) => r.score)) : 0

  card.innerHTML = `
        <h3>${course.title} - Final Quiz</h3>
        <p><strong>Questions:</strong> 10 | <strong>Time Limit:</strong> 30 minutes</p>
        ${hasAttempted ? `<p><strong>Best Score:</strong> ${bestScore}%</p>` : ""}
        <p>Test your knowledge of ${course.title} concepts</p>
        <button onclick="takeQuiz(${course.courseId})" class="cta-button" style="margin-top: 1rem; padding: 0.5rem 1rem; font-size: 0.9rem;">
            ${hasAttempted ? "Retake Quiz" : "Take Quiz"}
        </button>
        ${hasAttempted ? `<button onclick="viewQuizResults(${course.courseId})" style="margin-left: 0.5rem; padding: 0.5rem 1rem; font-size: 0.9rem; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">View Results</button>` : ""}
    `

  return card
}

// Take quiz
async function takeQuiz(courseId) {
  const course = await getCourse(courseId)
  if (!course) return

  // Simple quiz simulation (keep for demo, in real app would be more sophisticated)
  const questions = [
    { question: `What is the main focus of ${course.title}?`, options: ["A", "B", "C", "D"], correct: 0 },
    {
      question: `Who is the instructor for ${course.title}?`,
      options: [course.educatorId.toString(), "Other", "Another", "Different"],
      correct: 0,
    },
    {
      question: `How long is the ${course.title} course?`,
      options: [course.duration, "Different", "Other", "Another"],
      correct: 0,
    },
  ]

  let score = 0
  const answers = []

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const answer = prompt(
      `Question ${i + 1}: ${q.question}\n\n${q.options.map((opt, idx) => `${idx + 1}. ${opt}`).join("\n")}\n\nEnter your answer (1-4):`,
    )

    if (answer === null) {
      alert("Quiz cancelled.")
      return
    }

    const answerIndex = Number.parseInt(answer) - 1
    answers.push(answerIndex)

    if (answerIndex === q.correct) {
      score++
    }
  }

  const finalScore = Math.round((score / questions.length) * 100)

  // Save quiz result to backend
  try {
    const response = await fetch("http://localhost:51264/api/quizzes/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.userId, courseId: courseId, score: finalScore }),
    });

    if (response.ok) {
      alert(`Quiz completed!\nYour score: ${finalScore}%\n${score}/${questions.length} correct answers`)
      // Refresh displays
      await loadOverviewData()
      await loadQuizzes()
    } else {
      alert("Failed to save quiz result.")
    }
  } catch (error) {
    console.error("Error saving quiz result:", error)
    alert("An error occurred while saving quiz result.")
  }
}

// View quiz results
function viewQuizResults(courseId) {
  // Since we fetch on load, but for simplicity, alert from local or refetch if needed
  // But to keep simple, assume loadQuizzes has data, but here we can refetch
  // For now, keep as is, but in full integration, fetch and display
  alert("Viewing quiz results for course " + courseId + ". (Implement detailed view)")
}

// Load profile
function loadProfile() {
  document.getElementById("profileFirstName").value = currentUser.firstName
  document.getElementById("profileLastName").value = currentUser.lastName
  document.getElementById("profileEmail").value = currentUser.email
  document.getElementById("profileBio").value = currentUser.bio || ""
}

// Update profile
async function updateProfile() {
  const firstName = document.getElementById("profileFirstName").value.trim()
  const lastName = document.getElementById("profileLastName").value.trim()
  const bio = document.getElementById("profileBio").value.trim()

  if (firstName.length < 2 || lastName.length < 2) {
    alert("First name and last name must be at least 2 characters long.")
    return
  }

  try {
    const response = await fetch(`http://localhost:51264/api/users/${currentUser.userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, bio }),
    });

    if (response.ok) {
      // Update local user
      currentUser.firstName = firstName
      currentUser.lastName = lastName
      currentUser.bio = bio
      localStorage.setItem("studyvalyria_current_user", JSON.stringify(currentUser))

      // Update welcome message
      document.getElementById("welcomeMessage").textContent = `Welcome, ${currentUser.firstName}!`

      alert("Profile updated successfully!")
    } else {
      alert("Profile update failed.")
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    alert("An error occurred during profile update.")
  }
}

// Utility functions
async function getEnrolledCourses() {
  try {
    const response = await fetch(`http://localhost:51264/api/enrollments/user/${currentUser.userId}`);
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    return [];
  }
}

async function getAllCourses() {
  try {
    const response = await fetch("http://localhost:51264/api/courses");
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

async function getCourse(id) {
  try {
    const response = await fetch(`http://localhost:51264/api/courses/${id}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("Error fetching course:", error);
    return null;
  }
}

async function getQuizResults() {
  try {
    const response = await fetch(`http://localhost:51264/api/quizzes/results/user/${currentUser.userId}`);
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return [];
  }
}

// Remove unused localStorage functions like saveQuizResult, addEnrollmentRecord, updateCurrentUser

function formatDate(date) {
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function logout() {
  const confirmLogout = confirm("Are you sure you want to logout?")
  if (confirmLogout) {
    localStorage.removeItem("studyvalyria_current_user")
    window.location.href = "index.html"
  }
}
