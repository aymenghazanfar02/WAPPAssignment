// Educator dashboard functionality for StudyValyria platform

let currentUser = null
let currentSection = "overview"

document.addEventListener("DOMContentLoaded", () => {
  initializeEducatorDashboard()
})

// Initialize educator dashboard
async function initializeEducatorDashboard() {
  // Check if user is logged in and is an educator
  currentUser = JSON.parse(localStorage.getItem("studyvalyria_current_user"))
  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }

  if (!currentUser || currentUser.userType !== "educator") {
    alert("Access denied. Please login as an educator.")
    window.location.href = "login.html"
    return
  }

  // Fetch latest user data from backend
  try {
    const response = await fetch(`http://localhost:51264/api/users/${currentUser.userId}`);
    if (response.ok) {
      currentUser = await response.json();
      localStorage.setItem("studyvalyria_current_user", JSON.stringify(currentUser));
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }

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
      const enrollments = await getEnrollmentsByCourse(course.courseId);
      totalStudents += enrollments.length;
      totalRevenue += enrollments.length * parseFloat(course.price);
    }

    document.getElementById("totalCourses").textContent = totalCourses;
    document.getElementById("totalStudents").textContent = totalStudents;
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
    <h3>${course.title}</h3>
    <p>${course.description}</p>
    <p><strong>Duration:</strong> ${course.duration}</p>
    <p><strong>Level:</strong> ${course.level}</p>
    <p><strong>Price:</strong> $${course.price}</p>
    <div class="card-actions">
      <button onclick="editCourse(${course.courseId})" class="cta-button">Edit</button>
      <button onclick="deleteCourse(${course.courseId})" class="cta-button delete">Delete</button>
      <button onclick="viewCourseStudents(${course.courseId})" class="cta-button">View Students</button>
    </div>
  `;

  return card;
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
    const response = await fetch("http://localhost:51264/api/courses", {
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

    document.getElementById("courseTitle").value = course.title;
    document.getElementById("courseDescription").value = course.description;
    document.getElementById("courseDuration").value = course.duration;
    document.getElementById("courseLevel").value = course.level;
    document.getElementById("coursePrice").value = course.price;

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
    const response = await fetch(`http://localhost:51264/api/courses/${courseId}?educatorId=${currentUser.userId}`, {
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
      const enrollments = await getEnrollmentsByCourse(course.courseId);
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
    const response = await fetch(`http://localhost:51264/api/users/${currentUser.userId}`, {
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
  const response = await fetch(`http://localhost:51264/api/courses/educator/${currentUser.userId}`);
  if (!response.ok) throw new Error("Failed to fetch educator courses");
  return await response.json();
}

async function getCourse(courseId) {
  const response = await fetch(`http://localhost:51264/api/courses/${courseId}`);
  if (!response.ok) throw new Error("Failed to fetch course");
  return await response.json();
}

async function getEnrollmentsByCourse(courseId) {
  const response = await fetch(`http://localhost:51264/api/enrollments/course/${courseId}`);
  if (!response.ok) throw new Error("Failed to fetch enrollments");
  return await response.json();
}

// Remove getAllCourses, getAllEnrollments, updateCurrentUser as they are no longer needed

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
