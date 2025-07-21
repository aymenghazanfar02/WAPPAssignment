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

  // Load study hours from backend
  loadStudyHours()

  // Load recent activity from backend
  loadRecentActivity()
}

// Load recent activity from backend
async function loadRecentActivity() {
  try {
    const response = await fetch(`http://localhost:51264/api/activity/user/${currentUser.userId}`);
    const activities = response.ok ? await response.json() : [];

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
              <small style="color: #666;">${formatDate(new Date(activity.date))}</small>
          `
      activityList.appendChild(activityItem)
    })
  } catch (error) {
    console.error("Error loading recent activity:", error);
    document.getElementById("recentActivityList").innerHTML = "<p>Unable to load recent activity</p>"
  }
}

// Load study hours from backend
async function loadStudyHours() {
  try {
    const response = await fetch(`http://localhost:51264/api/activity/study-hours/${currentUser.userId}`);
    if (response.ok) {
      const data = await response.json();
      document.getElementById("studyHours").textContent = data.studyHours;
    } else {
      document.getElementById("studyHours").textContent = "0";
    }
  } catch (error) {
    console.error("Error loading study hours:", error);
    document.getElementById("studyHours").textContent = "0";
  }
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
      const courseCard = await createEnrolledCourseCard(course, enrollment)
      coursesList.appendChild(courseCard)
    }
  }
}

// Create enrolled course card
async function createEnrolledCourseCard(course, enrollment) {
  const card = document.createElement("div")
  card.className = "course-card"

  const progress = enrollment.progress
  
  // Fetch instructor name
  const instructorName = await getUserName(course.educatorId)

  card.innerHTML = `
        <h3>${course.title}</h3>
        <p><strong>Instructor:</strong> ${instructorName}</p>
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

  await displayAvailableCourses(availableCourses)
}

// Display available courses
async function displayAvailableCourses(courses) {
  const coursesList = document.getElementById("availableCoursesList")
  coursesList.innerHTML = ""

  if (courses.length === 0) {
    coursesList.innerHTML =
      '<p style="text-align: center; grid-column: 1 / -1;">No courses available matching your criteria.</p>'
    return
  }

  for (const course of courses) {
    const courseCard = await createAvailableCourseCard(course)
    coursesList.appendChild(courseCard)
  }
}

// Create available course card
async function createAvailableCourseCard(course) {
  const card = document.createElement("div")
  card.className = "course-card"

  // Fetch instructor name
  const instructorName = await getUserName(course.educatorId)

  card.innerHTML = `
        <h3>${course.title}</h3>
        <p><strong>Instructor:</strong> ${instructorName}</p>
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

  await displayAvailableCourses(availableCourses)
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

  // Fetch quiz questions from backend
  const questions = await getQuizQuestions(courseId)
  if (!questions || questions.length === 0) {
    alert("No quiz questions available for this course.")
    return
  }

  let score = 0
  const answers = []

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const answer = prompt(
      `Question ${i + 1}: ${q.Question}\n\n${q.Options.map((opt, idx) => `${idx + 1}. ${opt}`).join("\n")}\n\nEnter your answer (1-4):`,
    )

    if (answer === null) {
      alert("Quiz cancelled.")
      return
    }

    const answerIndex = Number.parseInt(answer) - 1
    answers.push(answerIndex)

    if (answerIndex === q.CorrectAnswer) {
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
async function viewQuizResults(courseId) {
  try {
    // Fetch quiz results for this specific course
    const response = await fetch(`http://localhost:51264/api/quizzes/results/user/${currentUser.userId}`);
    if (!response.ok) {
      alert("Failed to fetch quiz results.");
      return;
    }
    
    const allResults = await response.json();
    const courseResults = allResults.filter(result => result.CourseId === courseId);
    
    if (courseResults.length === 0) {
      alert("No quiz results found for this course.");
      return;
    }
    
    // Get course name
    const course = await getCourse(courseId);
    const courseName = course ? course.Title : `Course ${courseId}`;
    
    // Sort results by date (newest first)
    courseResults.sort((a, b) => new Date(b.Date) - new Date(a.Date));
    
    // Create detailed results display
    let resultsHtml = `<h3>Quiz Results for ${courseName}</h3>`;
    resultsHtml += `<div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 1rem; border-radius: 5px;">`;
    
    courseResults.forEach((result, index) => {
      const date = new Date(result.Date).toLocaleDateString() + " " + new Date(result.Date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const scoreColor = result.Score >= 80 ? "#27ae60" : result.Score >= 60 ? "#f39c12" : "#e74c3c";
      
      resultsHtml += `
        <div style="border-bottom: 1px solid #eee; padding: 1rem 0; ${index === courseResults.length - 1 ? 'border-bottom: none;' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: ${scoreColor};">Score: ${result.Score}%</strong>
              <br>
              <small style="color: #666;">Attempt ${index + 1} - ${date}</small>
            </div>
            <div style="text-align: right;">
              <span style="background: ${scoreColor}; color: white; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.9rem;">
                ${result.Score >= 80 ? 'Excellent' : result.Score >= 60 ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
          </div>
        </div>
      `;
    });
    
    resultsHtml += `</div>`;
    
    // Calculate statistics
    const bestScore = Math.max(...courseResults.map(r => r.Score));
    const averageScore = Math.round(courseResults.reduce((sum, r) => sum + r.Score, 0) / courseResults.length);
    const totalAttempts = courseResults.length;
    
    resultsHtml += `
      <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 5px;">
        <h4>Statistics</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
          <div><strong>Best Score:</strong> ${bestScore}%</div>
          <div><strong>Average Score:</strong> ${averageScore}%</div>
          <div><strong>Total Attempts:</strong> ${totalAttempts}</div>
        </div>
      </div>
    `;
    
    // Create modal-like display
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.5); z-index: 1000; display: flex; 
      justify-content: center; align-items: center;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white; padding: 2rem; border-radius: 10px; 
      max-width: 600px; width: 90%; max-height: 80%; overflow-y: auto;
    `;
    
    modalContent.innerHTML = resultsHtml + `
      <div style="text-align: center; margin-top: 1.5rem;">
        <button onclick="this.closest('.modal').remove()" 
                style="padding: 0.75rem 1.5rem; background: #3498db; color: white; 
                       border: none; border-radius: 5px; cursor: pointer; font-size: 1rem;">
          Close
        </button>
      </div>
    `;
    
    modal.className = 'modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
  } catch (error) {
    console.error("Error viewing quiz results:", error);
    alert("An error occurred while loading quiz results.");
  }
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

async function getQuizQuestions(courseId) {
  try {
    const response = await fetch(`http://localhost:51264/api/quizzes/questions/${courseId}`);
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    return [];
  }
}

// Remove unused localStorage functions like saveQuizResult, addEnrollmentRecord, updateCurrentUser

async function getUserName(userId) {
  try {
    const response = await fetch(`http://localhost:51264/api/users/${userId}/name`);
    if (response.ok) {
      const result = await response.json();
      return result.Name;
    }
    return `User ${userId}`;
  } catch (error) {
    console.error("Error fetching user name:", error);
    return `User ${userId}`;
  }
}

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
