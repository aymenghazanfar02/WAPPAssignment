// Student dashboard functionality for StudyValyria platform

let currentUser = null
let currentSection = "overview"

document.addEventListener("DOMContentLoaded", () => {
  initializeStudentDashboard()
})

// Initialize student dashboard
async function initializeStudentDashboard() {
  // Use centralized auth manager to protect page
  if (!authManager.protectPage('student')) {
    return
  }
  
  currentUser = authManager.getCurrentUser()

  // Refresh user data using auth manager
  await authManager.refreshUserData()
  currentUser = authManager.getCurrentUser()

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
    const response = await fetch(`http://localhost:51265/api/activity/user/${currentUser.userId}`);
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
    const response = await fetch(`http://localhost:51265/api/activity/study-hours/${currentUser.userId}`);
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
    const course = await getCourse(enrollment.CourseId)
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
  const instructorName = await getUserName(course.EducatorId)

  card.innerHTML = `
        <h3>${course.Title}</h3>
        <p><strong>Instructor:</strong> ${instructorName}</p>
        <p><strong>Duration:</strong> ${course.Duration}</p>
        <div style="margin: 1rem 0;">
            <div style="background: #f0f0f0; border-radius: 10px; overflow: hidden;">
                <div style="background: #3498db; height: 10px; width: ${progress}%; transition: width 0.3s;"></div>
            </div>
            <small>Progress: ${progress}%</small>
        </div>
        <button onclick="viewCourse(${course.CourseId})" class="cta-button" style="margin-top: 1rem; padding: 0.5rem 1rem; font-size: 0.9rem;">
            Continue Learning
        </button>
        <button onclick="unenrollFromCourse(${course.CourseId})" style="margin-left: 0.5rem; padding: 0.5rem 1rem; font-size: 0.9rem; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Unenroll
        </button>
    `

  return card
}

// Load available courses
async function loadAvailableCourses() {
  const allCourses = await getAllCourses()
  const enrolledCourseIds = (await getEnrolledCourses()).map((en) => en.courseId)
  const availableCourses = allCourses.filter((course) => !enrolledCourseIds.includes(course.CourseId))

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
  const instructorName = await getUserName(course.EducatorId)

  card.innerHTML = `
        <h3>${course.Title}</h3>
        <p><strong>Instructor:</strong> ${instructorName}</p>
        <p><strong>Duration:</strong> ${course.Duration}</p>
        <p><strong>Level:</strong> ${course.Level}</p>
        <p>${course.Description}</p>
        <div class="course-price">$${course.Price}</div>
        <button onclick="enrollInCourse(${course.CourseId})" class="cta-button" style="margin-top: 1rem; padding: 0.5rem 1rem; font-size: 0.9rem;">
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
  let availableCourses = allCourses.filter((course) => !enrolledCourseIds.includes(course.CourseId))

  // Apply search filter
  if (searchTerm) {
    availableCourses = availableCourses.filter(
      (course) =>
        course.Title.toLowerCase().includes(searchTerm) ||
        course.Description.toLowerCase().includes(searchTerm) ||
        course.EducatorId.toString().includes(searchTerm),
    )
  }

  // Apply level filter
  if (levelFilter !== "all") {
    availableCourses = availableCourses.filter((course) => course.Level.toLowerCase() === levelFilter)
  }

  await displayAvailableCourses(availableCourses)
}

// Enroll in course
async function enrollInCourse(courseId) {
  const course = await getCourse(courseId)
  if (!course) return

  const confirmEnrollment = confirm(`Are you sure you want to enroll in "${course.Title}" for $${course.Price}?`)
  if (!confirmEnrollment) return

  try {
    const response = await fetch("http://localhost:51265/api/enrollments", {
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



// View course details
async function viewCourse(courseId) {
  const course = await getCourse(courseId)
  if (!course) return

  alert(
    `Viewing course: ${course.title}\n\nThis would typically open the course content page with lessons, materials, and assignments.`,
  )
}

// Continue learning (alias for viewCourse)
async function continueLearnig(courseId) {
  await viewCourse(courseId)
}

// Unenroll from course
async function unenrollFromCourse(courseId) {
  // Debug: Check if currentUser is available
  if (!currentUser) {
    console.error('Error: currentUser is null or undefined')
    alert('Error: User session not found. Please refresh the page and try again.')
    return
  }

  if (!currentUser.userId) {
    console.error('Error: currentUser.userId is missing', currentUser)
    alert('Error: User ID not found. Please refresh the page and try again.')
    return
  }

  console.log('Attempting to unenroll user:', currentUser.userId, 'from course:', courseId)

  if (!confirm('Are you sure you want to unenroll from this course? This action cannot be undone.')) {
    return
  }

  try {
    const response = await fetch(`http://localhost:51265/api/enrollments/${currentUser.userId}/${courseId}`, {
      method: 'DELETE'
    })

    console.log('Unenroll response status:', response.status)

    if (response.ok) {
      alert('Successfully unenrolled from the course.')
      // Refresh the displays
      await loadOverviewData()
      await loadEnrolledCourses()
      await loadAvailableCourses()
    } else {
      const errorText = await response.text()
      console.error('Failed to unenroll. Response:', errorText)
      alert('Failed to unenroll from the course.')
    }
  } catch (error) {
    console.error('Error unenrolling from course:', error)
    alert('An error occurred while trying to unenroll.')
  }
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
    const course = await getCourse(enrollment.CourseId)
    if (course) {
      const courseResults = quizResults.filter((r) => r.courseId === course.CourseId)
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
        <h3>${course.Title} - Final Quiz</h3>
        <p><strong>Questions:</strong> 10 | <strong>Time Limit:</strong> 30 minutes</p>
        ${hasAttempted ? `<p><strong>Best Score:</strong> ${bestScore}%</p>` : ""}
        <p>Test your knowledge of ${course.Title} concepts</p>
        <button onclick="takeQuiz(${course.CourseId})" class="cta-button" style="margin-top: 1rem; padding: 0.5rem 1rem; font-size: 0.9rem;">
            ${hasAttempted ? "Retake Quiz" : "Take Quiz"}
        </button>
        ${hasAttempted ? `<button onclick="viewQuizResults(${course.CourseId})" style="margin-left: 0.5rem; padding: 0.5rem 1rem; font-size: 0.9rem; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">View Results</button>` : ""}
    `

  return card
}

// Take quiz
async function takeQuiz(courseId) {
  console.log('Taking quiz for course:', courseId)
  const course = await getCourse(courseId)
  if (!course) return

  // Fetch quiz questions from backend
  const questions = await getQuizQuestions(courseId)
  console.log('Quiz questions received:', questions)
  if (!questions || questions.length === 0) {
    alert("No quiz questions available for this course.")
    return
  }

  // Create quiz modal
  const modal = document.createElement('div')
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: rgba(0,0,0,0.5); z-index: 1000; display: flex; 
    justify-content: center; align-items: center;
  `

  const modalContent = document.createElement('div')
  modalContent.style.cssText = `
    background: white; padding: 2rem; border-radius: 10px; 
    max-width: 800px; width: 90%; max-height: 80%; overflow-y: auto;
  `

  let currentQuestionIndex = 0
  const answers = []

  function renderQuestion() {
    const q = questions[currentQuestionIndex]
    
    if (!q || !q.Options || !Array.isArray(q.Options)) {
      console.error('Invalid question data:', q)
      return
    }
    
    modalContent.innerHTML = `
      <h3>Quiz: ${course.Title}</h3>
      <div style="margin-bottom: 1rem;">
        <span>Question ${currentQuestionIndex + 1} of ${questions.length}</span>
        <div style="background: #f0f0f0; height: 8px; border-radius: 4px; margin-top: 0.5rem;">
          <div style="background: #3498db; height: 100%; width: ${((currentQuestionIndex + 1) / questions.length) * 100}%; border-radius: 4px;"></div>
        </div>
      </div>
      <h4>${q.Question}</h4>
      <div style="margin: 1rem 0;">
        ${q.Options.map((opt, idx) => `
          <label style="display: block; margin: 0.5rem 0; cursor: pointer;">
            <input type="radio" name="answer" value="${idx}" style="margin-right: 0.5rem;">
            ${opt}
          </label>
        `).join('')}
      </div>
      <div style="text-align: center; margin-top: 2rem;">
        ${currentQuestionIndex > 0 ? '<button id="prevBtn" style="padding: 0.75rem 1.5rem; margin-right: 1rem; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer;">Previous</button>' : ''}
        <button id="nextBtn" style="padding: 0.75rem 1.5rem; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
          ${currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next'}
        </button>
        <button id="cancelBtn" style="padding: 0.75rem 1.5rem; margin-left: 1rem; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
      </div>
    `
    
    // Add event listeners after setting innerHTML
    setTimeout(() => {
      const nextBtn = modalContent.querySelector('#nextBtn')
      const prevBtn = modalContent.querySelector('#prevBtn')
      const cancelBtn = modalContent.querySelector('#cancelBtn')
      
      if (nextBtn) {
        nextBtn.addEventListener('click', window.nextQuestion)
      }
      if (prevBtn) {
        prevBtn.addEventListener('click', window.previousQuestion)
      }
      if (cancelBtn) {
        cancelBtn.addEventListener('click', window.cancelQuiz)
      }
    }, 50)
  }

  window.nextQuestion = function() {
    const selectedAnswer = modalContent.querySelector('input[name="answer"]:checked')
    if (!selectedAnswer) {
      alert('Please select an answer before proceeding.')
      return
    }

    answers[currentQuestionIndex] = parseInt(selectedAnswer.value)
    console.log('Answer saved:', answers[currentQuestionIndex])

    if (currentQuestionIndex === questions.length - 1) {
      // Submit quiz
      console.log('Submitting quiz with answers:', answers)
      submitQuiz()
    } else {
      currentQuestionIndex++
      console.log('Moving to question:', currentQuestionIndex)
      renderQuestion()
    }
  }

  window.previousQuestion = function() {
    const selectedAnswer = modalContent.querySelector('input[name="answer"]:checked')
    if (selectedAnswer) {
      answers[currentQuestionIndex] = parseInt(selectedAnswer.value)
    }
    currentQuestionIndex--
    renderQuestion()
    // Pre-select previous answer if exists
    if (answers[currentQuestionIndex] !== undefined) {
      console.log('Restoring previous answer:', answers[currentQuestionIndex])
      const radio = modalContent.querySelector(`input[value="${answers[currentQuestionIndex]}"]`)
      if (radio) radio.checked = true
    }
  }

  window.cancelQuiz = function() {
    modal.remove()
    delete window.nextQuestion
    delete window.previousQuestion
    delete window.cancelQuiz
  }

  async function submitQuiz() {
    let score = 0
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].CorrectAnswer) {
        score++
      }
    }

    const finalScore = Math.round((score / questions.length) * 100)

    try {
      const response = await fetch("http://localhost:51265/api/quizzes/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.userId, courseId: courseId, score: finalScore }),
      });

      if (response.ok) {
        modalContent.innerHTML = `
          <div style="text-align: center;">
            <h3>Quiz Completed!</h3>
            <div style="font-size: 3rem; margin: 1rem 0; color: ${finalScore >= 80 ? '#27ae60' : finalScore >= 60 ? '#f39c12' : '#e74c3c'};">🎯</div>
            <h2>Your Score: ${finalScore}%</h2>
            <p>You got ${score} out of ${questions.length} questions correct.</p>
            <div style="margin: 2rem 0;">
              <div style="background: #f0f0f0; height: 20px; border-radius: 10px; overflow: hidden;">
                <div style="background: ${finalScore >= 80 ? '#27ae60' : finalScore >= 60 ? '#f39c12' : '#e74c3c'}; height: 100%; width: ${finalScore}%; transition: width 0.5s;"></div>
              </div>
            </div>
            <button onclick="closeQuizModal()" style="padding: 1rem 2rem; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem;">Close</button>
          </div>
        `
        
        window.closeQuizModal = function() {
          modal.remove()
          delete window.nextQuestion
          delete window.previousQuestion
          delete window.cancelQuiz
          delete window.closeQuizModal
          // Refresh displays
          loadOverviewData()
          loadQuizzes()
        }
      } else {
        alert("Failed to save quiz result.")
        modal.remove()
      }
    } catch (error) {
      console.error("Error saving quiz result:", error)
      alert("An error occurred while saving quiz result.")
      modal.remove()
    }
  }

  modal.appendChild(modalContent)
  document.body.appendChild(modal)
  renderQuestion()
  
  // Add event listeners after rendering
  setTimeout(() => {
    const nextBtn = modalContent.querySelector('#nextBtn')
    const prevBtn = modalContent.querySelector('#prevBtn')
    const cancelBtn = modalContent.querySelector('#cancelBtn')
    
    if (nextBtn) {
      nextBtn.addEventListener('click', window.nextQuestion)
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', window.previousQuestion)
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', window.cancelQuiz)
    }
  }, 100)
  


  // Pre-select answer if returning to previous question
  if (answers[currentQuestionIndex] !== undefined) {
    setTimeout(() => {
      const radio = modalContent.querySelector(`input[value="${answers[currentQuestionIndex]}"]`)
      if (radio) radio.checked = true
    }, 100)
  }
}

// View quiz results
async function viewQuizResults(courseId) {
  try {
    // Fetch quiz results for this specific course
    const response = await fetch(`http://localhost:51265/api/quizzes/results/user/${currentUser.userId}`);
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
    const response = await fetch(`http://localhost:51265/api/users/${currentUser.userId}`, {
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
    const response = await fetch(`http://localhost:51265/api/enrollments/user/${currentUser.userId}`);
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
    const response = await fetch("http://localhost:51265/api/courses");
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
    const response = await fetch(`http://localhost:51265/api/courses/${id}`);
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
    const response = await fetch(`http://localhost:51265/api/quizzes/results/user/${currentUser.userId}`);
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
    const response = await fetch(`http://localhost:51265/api/quizzes/questions/${courseId}`);
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
    const response = await fetch(`http://localhost:51265/api/users/${userId}/name`);
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
  authManager.logout()
}
