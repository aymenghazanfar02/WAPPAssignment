// Educator dashboard functionality for StudyValyria platform

let currentUser = null
let currentSection = "overview"

document.addEventListener("DOMContentLoaded", () => {
  initializeEducatorDashboard()
})

// Initialize educator dashboard
async function initializeEducatorDashboard() {
  // Use centralized auth manager to protect page
  if (!authManager.protectPage('educator')) {
    return
  }
  
  currentUser = authManager.getCurrentUser()

  // Refresh user data using auth manager
  await authManager.refreshUserData()
  currentUser = authManager.getCurrentUser()

  try {

    displayWelcomeMessage();
    await loadOverviewData();
    await loadEducatorCourses();
    await loadStudents();
    loadProfile();
    setupEventListeners();
  } catch (error) {
    console.error("Error initializing dashboard:", error);
    alert("An error occurred while loading the dashboard. Please try again.");
  }
}

// Setup event listeners
function setupEventListeners() {
  // Create course form
  document.getElementById("createCourseForm").addEventListener("submit", (e) => {
    e.preventDefault()
    createCourse()
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
  
  // Load quiz courses when quiz section is shown
  if (sectionName === 'quizzes') {
    loadQuizCourses();
  }
}

// Load overview data
function displayWelcomeMessage() {
  document.getElementById("welcomeMessage").textContent = `Welcome, ${currentUser.firstName}!`;
}

async function loadOverviewData() {
  try {
    const courses = await getEducatorCourses();
    const totalCourses = courses.length;
    let totalStudents = 0;
    let totalRevenue = 0;

    for (const course of courses) {
      const enrollments = await getEnrollmentsByCourse(course.CourseId);
      totalStudents += enrollments.length;
      totalRevenue += enrollments.length * parseFloat(course.price);
    }

    document.getElementById("createdCoursesCount").textContent = totalCourses;
    document.getElementById("totalStudentsCount").textContent = totalStudents;
    document.getElementById("totalRevenue").textContent = `$${totalRevenue.toFixed(2)}`;
  } catch (error) {
    console.error("Error loading overview data:", error);
  }
}

async function loadEducatorCourses() {
  try {
    const courses = await getEducatorCourses();
    const coursesList = document.getElementById("educatorCoursesList");
    coursesList.innerHTML = "";

    if (courses.length === 0) {
      coursesList.innerHTML = "<p>You haven't created any courses yet.</p>";
      return;
    }

    courses.forEach((course) => {
      const card = createEducatorCourseCard(course);
      coursesList.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading educator courses:", error);
  }
}

function createEducatorCourseCard(course) {
  const card = document.createElement("div");
  card.className = "course-card";

  card.innerHTML = `
    <h3>${course.Title}</h3>
    <p>${course.Description}</p>
    <p><strong>Duration:</strong> ${course.Duration}</p>
    <p><strong>Level:</strong> ${course.Level}</p>
    <p><strong>Price:</strong> $${course.Price}</p>
    <div class="card-actions">
      <button onclick="editCourse(${course.CourseId})" class="cta-button">Edit</button>
      <button onclick="deleteCourse(${course.CourseId})" class="cta-button delete">Delete</button>
      <button onclick="viewCourseStudents(${course.CourseId})" class="cta-button">View Students</button>
    </div>
  `;

  return card;
}

// Validate course form
function validateCourseForm(formData) {
  let isValid = true;
  
  // Clear any previous error messages
  const errorElements = document.querySelectorAll('.error-message');
  errorElements.forEach(el => el.remove());
  
  // Validate title
  if (!formData.title || formData.title.length < 3) {
    showFieldError('courseTitle', 'Course title must be at least 3 characters long.');
    isValid = false;
  }
  
  // Validate description
  if (!formData.description || formData.description.length < 10) {
    showFieldError('courseDescription', 'Course description must be at least 10 characters long.');
    isValid = false;
  }
  
  // Validate duration
  if (!formData.duration) {
    showFieldError('courseDuration', 'Course duration is required.');
    isValid = false;
  }
  
  // Validate level
  if (!formData.level) {
    showFieldError('courseLevel', 'Course level is required.');
    isValid = false;
  }
  
  // Validate price
  if (!formData.price) {
    showFieldError('coursePrice', 'Course price is required.');
    isValid = false;
  } else {
    // Remove $ sign and validate numeric value
    const priceValue = formData.price.replace('$', '').trim();
    if (isNaN(priceValue) || parseFloat(priceValue) < 0) {
      showFieldError('coursePrice', 'Please enter a valid price (e.g., $99 or 99).');
      isValid = false;
    }
  }
  
  return isValid;
}

// Show field error message
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (field) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = 'red';
    errorDiv.style.fontSize = '0.9em';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
  }
}

// Create course
async function createCourse() {
  const formData = {
    title: document.getElementById("courseTitle").value.trim(),
    description: document.getElementById("courseDescription").value.trim(),
    duration: document.getElementById("courseDuration").value.trim(),
    level: document.getElementById("courseLevel").value,
    price: document.getElementById("coursePrice").value.trim(),
    educatorId: currentUser.userId
  };

  if (!validateCourseForm(formData)) {
    return;
  }

  try {
    const response = await fetch("http://localhost:51265/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error("Failed to create course");

    alert("Course created successfully!");
    document.getElementById("createCourseForm").reset();
    await loadEducatorCourses();
    await loadOverviewData();
    showSection("courses");
  } catch (error) {
    console.error("Error creating course:", error);
    alert("An error occurred while creating the course.");
  }
}

async function editCourse(courseId) {
  try {
    const course = await getCourse(courseId);
    if (!course) return;

    document.getElementById("courseTitle").value = course.Title;
    document.getElementById("courseDescription").value = course.Description;
    document.getElementById("courseDuration").value = course.Duration;
    document.getElementById("courseLevel").value = course.Level;
    document.getElementById("coursePrice").value = course.Price;

    showSection("create");

    const form = document.getElementById("createCourseForm");
    form.onsubmit = async (e) => {
      e.preventDefault();
      await updateCourse(courseId);
    };

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = "Update Course";
  } catch (error) {
    console.error("Error editing course:", error);
  }
}

async function updateCourse(courseId) {
  const formData = {
    title: document.getElementById("courseTitle").value.trim(),
    description: document.getElementById("courseDescription").value.trim(),
    duration: document.getElementById("courseDuration").value.trim(),
    level: document.getElementById("courseLevel").value,
    price: document.getElementById("coursePrice").value.trim(),
  };

  if (!validateCourseForm(formData)) {
    return;
  }

  try {
    const response = await fetch(`/api/courses/${courseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error("Failed to update course");

    alert("Course updated successfully!");
    document.getElementById("createCourseForm").reset();

    const form = document.getElementById("createCourseForm");
    form.onsubmit = (e) => {
      e.preventDefault();
      createCourse();
    };

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = "Create Course";

    await loadEducatorCourses();
    showSection("courses");
  } catch (error) {
    console.error("Error updating course:", error);
    alert("An error occurred while updating the course.");
  }
}

async function deleteCourse(courseId) {
  const confirmDelete = confirm("Are you sure you want to delete this course? This action cannot be undone.");
  if (!confirmDelete) return;

  try {
    const response = await fetch(`http://localhost:51265/api/courses/${courseId}?educatorId=${currentUser.userId}`, {
      method: "DELETE"
    });

    if (!response.ok) throw new Error("Failed to delete course");

    alert("Course deleted successfully.");
    await loadOverviewData();
    await loadEducatorCourses();
  } catch (error) {
    console.error("Error deleting course:", error);
    alert("An error occurred while deleting the course.");
  }
}

async function viewCourseStudents(courseId) {
  try {
    const enrollments = await getEnrollmentsByCourse(courseId);
    if (enrollments.length === 0) {
      alert("No students enrolled in this course yet.");
      return;
    }

    const course = await getCourse(courseId);
    let studentList = `Students enrolled in "${course.title}":\n\n`;

    enrollments.forEach((enrollment, index) => {
      studentList += `${index + 1}. ${enrollment.firstName} ${enrollment.lastName} (${enrollment.email})\n`;
      studentList += `   Enrolled: ${formatDate(new Date(enrollment.enrollmentDate))}\n\n`;
    });

    alert(studentList);
  } catch (error) {
    console.error("Error viewing course students:", error);
  }
}

async function loadStudents() {
  try {
    const educatorCourses = await getEducatorCourses();
    const studentsList = document.getElementById("studentsList");
    studentsList.innerHTML = "";

    const studentMap = new Map();

    for (const course of educatorCourses) {
      const enrollments = await getEnrollmentsByCourse(course.CourseId);
      enrollments.forEach((enrollment) => {
        if (!studentMap.has(enrollment.userId)) {
          studentMap.set(enrollment.userId, {
            student: enrollment,
            courses: []
          });
        }
        studentMap.get(enrollment.userId).courses.push({
          course,
          enrollment
        });
      });
    }

    if (studentMap.size === 0) {
      studentsList.innerHTML = "<p>No students enrolled in your courses yet.</p>";
      return;
    }

    studentMap.forEach((studentData) => {
      const studentCard = createStudentCard(studentData);
      studentsList.appendChild(studentCard);
    });
  } catch (error) {
    console.error("Error loading students:", error);
  }
}

function createStudentCard(studentData) {
  const card = document.createElement("div");
  card.className = "course-card";
  card.style.marginBottom = "1rem";

  const coursesList = studentData.courses
    .map(
      (courseData) =>
        `<li>${courseData.course.title} (Enrolled: ${formatDate(new Date(courseData.enrollment.enrollmentDate))})</li>`,
    )
    .join("");

  card.innerHTML = `
    <h3>${studentData.student.firstName} ${studentData.student.lastName}</h3>
    <p><strong>Email:</strong> ${studentData.student.email}</p>
    <p><strong>Enrolled Courses:</strong></p>
    <ul style="margin-left: 1rem;">
      ${coursesList}
    </ul>
    <button onclick="contactStudent('${studentData.student.email}')" class="cta-button" style="margin-top: 1rem; padding: 0.5rem 1rem; font-size: 0.9rem;">
      Contact Student
    </button>
  `;

  return card;
}

// Contact student
function contactStudent(email) {
  alert(`This would open your email client to send a message to ${email}`)
}

// Load profile
function loadProfile() {
  document.getElementById("profileFirstName").value = currentUser.firstName;
  document.getElementById("profileLastName").value = currentUser.lastName;
  document.getElementById("profileEmail").value = currentUser.email;
  document.getElementById("profileBio").value = currentUser.bio || "";
}

async function updateProfile() {
  const formData = {
    firstName: document.getElementById("profileFirstName").value.trim(),
    lastName: document.getElementById("profileLastName").value.trim(),
    bio: document.getElementById("profileBio").value.trim()
  };

  if (formData.firstName.length < 2 || formData.lastName.length < 2) {
    alert("First name and last name must be at least 2 characters long.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:51265/api/users/${currentUser.userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error("Failed to update profile");

    const updatedUser = await response.json();
    currentUser = { ...currentUser, ...updatedUser };

    document.getElementById("welcomeMessage").textContent = `Welcome, ${currentUser.firstName}!`;
    alert("Profile updated successfully!");
  } catch (error) {
    console.error("Error updating profile:", error);
    alert("An error occurred while updating the profile.");
  }
}

// Utility functions
async function getEducatorCourses() {
  const response = await fetch(`http://localhost:51265/api/courses/educator/${currentUser.userId}`);
  if (!response.ok) throw new Error("Failed to fetch educator courses");
  return await response.json();
}

async function getCourse(courseId) {
  const response = await fetch(`http://localhost:51265/api/courses/${courseId}`);
  if (!response.ok) throw new Error("Failed to fetch course");
  return await response.json();
}

async function getEnrollmentsByCourse(courseId) {
  const response = await fetch(`http://localhost:51265/api/enrollments/course/${courseId}`);
  if (!response.ok) throw new Error("Failed to fetch enrollments");
  return await response.json();
}

// Remove getAllCourses, getAllEnrollments, updateCurrentUser as they are no longer needed

function formatDate(date) {
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function logout() {
  authManager.logout()
}

// Quiz Management Functions

// Load courses into quiz course selector
async function loadQuizCourses() {
  try {
    const courses = await getEducatorCourses();
    const select = document.getElementById('quizCourseSelect');
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">Choose a course...</option>';
    
    courses.forEach(course => {
      const option = document.createElement('option');
      option.value = course.CourseId;
      option.textContent = course.Title;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading courses for quiz:', error);
    alert('Failed to load courses. Please try again.');
  }
}

// Load quiz questions for selected course
async function loadQuizQuestions() {
  const courseId = document.getElementById('quizCourseSelect').value;
  const container = document.getElementById('quizQuestionsContainer');
  const questionsList = document.getElementById('quizQuestionsList');
  
  if (!courseId) {
    container.style.display = 'none';
    return;
  }
  
  try {
    const questions = await getQuizQuestions(courseId);
    container.style.display = 'block';
    
    if (questions.length === 0) {
      questionsList.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No quiz questions found for this course. Add some questions to get started!</p>';
      return;
    }
    
    questionsList.innerHTML = questions.map(question => `
      <div class="quiz-question-card" style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
          <h4 style="margin: 0; color: #2c3e50; flex: 1;">${question.Question}</h4>
          <div style="display: flex; gap: 0.5rem;">
            <button onclick="editQuizQuestion(${question.QuestionId})" style="background: #f39c12; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">Edit</button>
            <button onclick="deleteQuizQuestion(${question.QuestionId})" style="background: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">Delete</button>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
          <div style="padding: 0.5rem; background: ${question.CorrectAnswer == 1 ? '#d5f4e6' : '#f8f9fa'}; border-radius: 4px; border-left: 3px solid ${question.CorrectAnswer == 1 ? '#27ae60' : '#ddd'};">A) ${question.OptionA}</div>
          <div style="padding: 0.5rem; background: ${question.CorrectAnswer == 2 ? '#d5f4e6' : '#f8f9fa'}; border-radius: 4px; border-left: 3px solid ${question.CorrectAnswer == 2 ? '#27ae60' : '#ddd'};">B) ${question.OptionB}</div>
          <div style="padding: 0.5rem; background: ${question.CorrectAnswer == 3 ? '#d5f4e6' : '#f8f9fa'}; border-radius: 4px; border-left: 3px solid ${question.CorrectAnswer == 3 ? '#27ae60' : '#ddd'};">C) ${question.OptionC}</div>
          <div style="padding: 0.5rem; background: ${question.CorrectAnswer == 4 ? '#d5f4e6' : '#f8f9fa'}; border-radius: 4px; border-left: 3px solid ${question.CorrectAnswer == 4 ? '#27ae60' : '#ddd'};">D) ${question.OptionD}</div>
        </div>
        <div style="font-size: 0.9rem; color: #27ae60; font-weight: bold;">Correct Answer: Option ${['A', 'B', 'C', 'D'][question.CorrectAnswer - 1]}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading quiz questions:', error);
    questionsList.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 2rem;">Failed to load quiz questions. Please try again.</p>';
  }
}

// Show add question form
function showAddQuestionForm() {
  document.getElementById('addQuestionForm').style.display = 'block';
  document.getElementById('quizQuestionForm').reset();
}

// Cancel add question
function cancelAddQuestion() {
  document.getElementById('addQuestionForm').style.display = 'none';
  document.getElementById('quizQuestionForm').reset();
}

// Add quiz question form submission
document.addEventListener('DOMContentLoaded', () => {
  const quizForm = document.getElementById('quizQuestionForm');
  if (quizForm) {
    quizForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await addQuizQuestion();
    });
  }
});

// Add new quiz question
async function addQuizQuestion() {
  const courseId = document.getElementById('quizCourseSelect').value;
  
  if (!courseId) {
    alert('Please select a course first.');
    return;
  }
  
  const formData = {
    courseId: parseInt(courseId),
    question: document.getElementById('questionText').value.trim(),
    optionA: document.getElementById('optionA').value.trim(),
    optionB: document.getElementById('optionB').value.trim(),
    optionC: document.getElementById('optionC').value.trim(),
    optionD: document.getElementById('optionD').value.trim(),
    correctAnswer: parseInt(document.getElementById('correctAnswer').value)
  };
  
  // Validate form data
  if (!formData.question || !formData.optionA || !formData.optionB || !formData.optionC || !formData.optionD || !formData.correctAnswer) {
    alert('Please fill in all fields.');
    return;
  }
  
  try {
    await createQuizQuestion(formData);
    alert('Quiz question added successfully!');
    cancelAddQuestion();
    await loadQuizQuestions(); // Reload questions
  } catch (error) {
    console.error('Error adding quiz question:', error);
    alert('Failed to add quiz question. Please try again.');
  }
}

// Delete quiz question
async function deleteQuizQuestion(questionId) {
  if (!confirm('Are you sure you want to delete this quiz question?')) {
    return;
  }
  
  try {
    await deleteQuizQuestionAPI(questionId);
    alert('Quiz question deleted successfully!');
    await loadQuizQuestions(); // Reload questions
  } catch (error) {
    console.error('Error deleting quiz question:', error);
    alert('Failed to delete quiz question. Please try again.');
  }
}

// Edit quiz question (simplified - shows prompt for now)
async function editQuizQuestion(questionId) {
  // For now, we'll use a simple approach with prompts
  // In a real application, you'd want a proper edit form
  const courseId = document.getElementById('quizCourseSelect').value;
  const questions = await getQuizQuestions(courseId);
  const question = questions.find(q => q.QuestionId === questionId);
  
  if (!question) {
    alert('Question not found.');
    return;
  }
  
  const newQuestion = prompt('Edit question:', question.Question);
  if (newQuestion === null) return; // User cancelled
  
  const newOptionA = prompt('Edit Option A:', question.OptionA);
  if (newOptionA === null) return;
  
  const newOptionB = prompt('Edit Option B:', question.OptionB);
  if (newOptionB === null) return;
  
  const newOptionC = prompt('Edit Option C:', question.OptionC);
  if (newOptionC === null) return;
  
  const newOptionD = prompt('Edit Option D:', question.OptionD);
  if (newOptionD === null) return;
  
  const newCorrectAnswer = prompt('Edit Correct Answer (1-4):', question.CorrectAnswer);
  if (newCorrectAnswer === null) return;
  
  const updatedData = {
    questionId: questionId,
    courseId: parseInt(courseId),
    question: newQuestion.trim(),
    optionA: newOptionA.trim(),
    optionB: newOptionB.trim(),
    optionC: newOptionC.trim(),
    optionD: newOptionD.trim(),
    correctAnswer: parseInt(newCorrectAnswer)
  };
  
  if (!updatedData.question || !updatedData.optionA || !updatedData.optionB || !updatedData.optionC || !updatedData.optionD || !updatedData.correctAnswer || updatedData.correctAnswer < 1 || updatedData.correctAnswer > 4) {
    alert('Please provide valid data for all fields.');
    return;
  }
  
  try {
    await updateQuizQuestion(updatedData);
    alert('Quiz question updated successfully!');
    await loadQuizQuestions(); // Reload questions
  } catch (error) {
    console.error('Error updating quiz question:', error);
    alert('Failed to update quiz question. Please try again.');
  }
}

// API functions for quiz management

// Get quiz questions for a course
async function getQuizQuestions(courseId) {
  const response = await fetch(`http://localhost:51265/api/quizzes/questions/${courseId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch quiz questions');
  }
  return await response.json();
}

// Create new quiz question
async function createQuizQuestion(questionData) {
  const response = await fetch('http://localhost:51265/api/quizzes/questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(questionData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create quiz question');
  }
  
  return await response.json();
}

// Update quiz question
async function updateQuizQuestion(questionData) {
  const response = await fetch(`http://localhost:51265/api/quizzes/questions/${questionData.questionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(questionData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to update quiz question');
  }
  
  return await response.json();
}

// Delete quiz question
async function deleteQuizQuestionAPI(questionId) {
  const response = await fetch(`http://localhost:51265/api/quizzes/questions/${questionId}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete quiz question');
  }
  
  return true;
}
