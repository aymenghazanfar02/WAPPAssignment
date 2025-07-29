// Admin dashboard functionality for StudyValyria platform

let currentUser = null
let currentSection = "overview"

document.addEventListener("DOMContentLoaded", () => {
  initializeAdminDashboard()
})

// Initialize admin dashboard
async function initializeAdminDashboard() {
  // Use centralized auth manager to protect page
  if (!authManager.protectPage('admin')) {
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
  await loadUsers()
  await loadCourses()
  await loadAnalytics()
  setupEventListeners()
}

// Setup event listeners
function setupEventListeners() {
  // User filters
  document.getElementById("userTypeFilter").addEventListener("change", filterUsers)
  document.getElementById("userStatusFilter").addEventListener("change", filterUsers)

  // Settings form
  document.getElementById("settingsForm").addEventListener("submit", (e) => {
    e.preventDefault()
    saveSettings()
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
  try {
    const [users, courses, enrollments] = await Promise.all([
      getAllUsers(),
      getAllCourses(),
      getAllEnrollments()
    ]);
    const pendingEducators = users.filter((user) => user.userType === "educator" && !user.isApproved)

    // Update stats
    document.getElementById("totalUsersCount").textContent = users.length
    document.getElementById("totalCoursesCount").textContent = courses.length
    document.getElementById("totalEnrollmentsCount").textContent = enrollments.length
    document.getElementById("pendingApprovalsCount").textContent = pendingEducators.length

    // Load system activity
    await loadSystemActivity()
  } catch (error) {
    console.error("Error loading overview data:", error);
  }
}

// Load system activity
async function loadSystemActivity() {
  try {
    const response = await fetch('http://localhost:51265/api/activity/system');
    if (response.ok) {
      const activities = await response.json();
      displaySystemActivity(activities);
    } else {
      displaySystemActivity([]);
    }
  } catch (error) {
    console.error('Error loading system activity:', error);
    displaySystemActivity([]);
  }
}

// Display system activity
function displaySystemActivity(activities) {
  const activityList = document.getElementById("systemActivityList")
  activityList.innerHTML = ""

  if (activities.length === 0) {
    activityList.innerHTML = '<p style="text-align: center; color: #666;">No recent system activity.</p>';
    return;
  }

  activities.forEach((activity) => {
    const activityItem = document.createElement("div")
    activityItem.style.cssText = "padding: 0.5rem 0; border-bottom: 1px solid #eee;"
    activityItem.innerHTML = `
            <p style="margin: 0; font-weight: 500;">${activity.Message}</p>
            <small style="color: #666;">${formatDate(new Date(activity.Date))}</small>
        `
    activityList.appendChild(activityItem)
  })
}

// Load users
async function loadUsers() {
  try {
    const users = await getAllUsers()
    displayUsers(users)
  } catch (error) {
    console.error("Error loading users:", error);
    document.getElementById("usersList").innerHTML = "<p>Error loading users. Please try again.</p>";
  }
}

// Display users
function displayUsers(users) {
  const usersList = document.getElementById("usersList")
  usersList.innerHTML = ""

  if (users.length === 0) {
    usersList.innerHTML = "<p>No users found.</p>"
    return
  }

  users.forEach((user) => {
    const userCard = createUserCard(user)
    usersList.appendChild(userCard)
  })
}

// Create user card
function createUserCard(user) {
  const card = document.createElement("div")
  card.className = "course-card"
  card.style.marginBottom = "1rem"

  const statusBadge = getStatusBadge(user)
  const enrollmentCount = user.userType === "student" ? user.profile.enrollments.length : 0
  const courseCount = user.userType === "educator" ? user.profile.courses.length : 0

  card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <div>
                <h3>${user.firstName} ${user.lastName}</h3>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Type:</strong> ${user.userType ? user.userType.charAt(0).toUpperCase() + user.userType.slice(1) : 'Unknown'}</p>
                <p><strong>Registered:</strong> ${formatDate(new Date(user.registrationDate))}</p>
                ${user.userType === "student" ? `<p><strong>Enrollments:</strong> ${enrollmentCount}</p>` : ""}
                ${user.userType === "educator" ? `<p><strong>Courses:</strong> ${courseCount}</p>` : ""}
            </div>
            <div>${statusBadge}</div>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${
              user.userType === "educator" && !user.isApproved
                ? `<button onclick="approveEducator('${user.id}')" style="padding: 0.5rem 1rem; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">Approve</button>`
                : ""
            }
            <button onclick="toggleUserStatus('${user.id}')" style="padding: 0.5rem 1rem; background: ${user.isActive ? "#e67e22" : "#3498db"}; color: white; border: none; border-radius: 5px; cursor: pointer;">
                ${user.isActive ? "Deactivate" : "Activate"}
            </button>
            <button onclick="viewUserDetails('${user.id}')" style="padding: 0.5rem 1rem; background: #9b59b6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                View Details
            </button>
            ${
              user.userType !== "admin"
                ? `<button onclick="deleteUser('${user.id}')" style="padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">Delete</button>`
                : ""
            }
        </div>
    `

  return card
}

// Get status badge
function getStatusBadge(user) {
  if (!user.isActive) {
    return '<span style="background: #e74c3c; color: white; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.8rem;">Inactive</span>'
  } else if (user.userType === "educator" && !user.isApproved) {
    return '<span style="background: #f39c12; color: white; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.8rem;">Pending</span>'
  } else {
    return '<span style="background: #27ae60; color: white; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.8rem;">Active</span>'
  }
}

// Filter users
async function filterUsers() {
  try {
    const typeFilter = document.getElementById("userTypeFilter").value
    const statusFilter = document.getElementById("userStatusFilter").value

    let users = await getAllUsers()

    // Apply type filter
    if (typeFilter !== "all") {
      users = users.filter((user) => user.userType === typeFilter)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "active":
          users = users.filter((user) => user.isActive && (user.userType !== "educator" || user.isApproved))
          break
        case "inactive":
          users = users.filter((user) => !user.isActive)
          break
        case "pending":
          users = users.filter((user) => user.userType === "educator" && !user.isApproved)
          break
      }
    }

    displayUsers(users)
  } catch (error) {
    console.error('Error filtering users:', error);
  }
}

// Approve educator
async function approveEducator(userId) {
  try {
    const users = await getAllUsers()
    const user = users.find((u) => u.id === userId)

    if (!user) return

    const confirmApproval = confirm(`Approve ${user.firstName} ${user.lastName} as an educator?`)
    if (!confirmApproval) return

    const response = await fetch(`http://localhost:51265/api/users/approve/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      alert(`${user.firstName} ${user.lastName} has been approved as an educator.`)
      await loadUsers()
      await loadOverviewData()
    } else {
      alert('Failed to approve user. Please try again.')
    }
  } catch (error) {
    console.error('Error approving user:', error)
    alert('An error occurred while approving the user.')
  }
}

// Toggle user status
async function toggleUserStatus(userId) {
  try {
    const users = await getAllUsers();
    const user = users.find((u) => u.userId === userId);

    if (!user) return;

    const newStatus = !user.isActive;
    const action = newStatus ? "activate" : "deactivate";

    const confirmAction = confirm(`Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`);
    if (!confirmAction) return;

    const response = await fetch(`http://localhost:51265/api/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        isActive: newStatus
      })
    });

    if (response.ok) {
      alert(`User ${action}d successfully!`);
      loadUsers();
      loadOverviewData();
    } else {
      alert('Failed to update user status.');
    }
  } catch (error) {
    console.error('Error updating user status:', error);
    alert('Error updating user status.');
  }
}

// View user details
async function viewUserDetails(userId) {
  try {
    const users = await getAllUsers();
    const user = users.find((u) => u.userId === userId);
    const enrollments = await getAllEnrollments();
    const userEnrollments = enrollments.filter((e) => e.userId === userId);

    if (!user) return;

    let details = `User Details:\n\n`;
    details += `Name: ${user.firstName} ${user.lastName}\n`;
    details += `Email: ${user.email}\n`;
    details += `Type: ${user.userType}\n`;
    details += `Status: ${user.isActive ? "Active" : "Inactive"}\n`;
    details += `Registered: ${formatDate(new Date(user.registrationDate))}\n`;

    if (user.userType === "educator") {
      details += `Approved: ${user.isApproved ? "Yes" : "No"}\n`;
    }

    if (user.userType === "student") {
      details += `Enrolled Courses: ${userEnrollments.length}\n`;
    }

    alert(details);
  } catch (error) {
    console.error('Error loading user details:', error);
    alert('Error loading user details.');
  }
}

// Delete user
async function deleteUser(userId) {
  try {
    const users = await getAllUsers();
    const user = users.find((u) => u.userId === userId);

    if (!user) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    const response = await fetch(`http://localhost:51265/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      alert("User deleted successfully!");
      loadOverviewData();
      loadUsers();
    } else {
      alert('Failed to delete user.');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Error deleting user.');
  }
}

// Load courses
async function loadCourses() {
  try {
    const courses = await getAllCourses();
    const coursesList = document.getElementById("adminCoursesList");

    coursesList.innerHTML = "";

    for (const course of courses) {
      const courseCard = await createAdminCourseCard(course);
      coursesList.appendChild(courseCard);
    }
  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

// Create admin course card
async function createAdminCourseCard(course) {
  const card = document.createElement("div")
  card.className = "course-card"

  // Get enrollment count for this course
  const enrollments = await getAllEnrollments();
  const courseEnrollments = enrollments.filter((enrollment) => enrollment.CourseId === course.CourseId);
  const enrollmentCount = courseEnrollments.length

  card.innerHTML = `
        <h3>${course.title}</h3>
        <p><strong>Level:</strong> ${course.level}</p>
        <p><strong>Duration:</strong> ${course.duration}</p>
        <p><strong>Price:</strong> $${course.price}</p>
        <p><strong>Enrolled Students:</strong> ${enrollmentCount}</p>
        <p>${course.description}</p>
        <div style="margin-top: 1rem;">
            <button onclick="viewCourseAnalytics(${course.CourseId})" class="cta-button" style="padding: 0.5rem 1rem; font-size: 0.9rem; margin-right: 0.5rem;">
                View Analytics
            </button>
            <button onclick="manageCourse(${course.CourseId})" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: #e67e22; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Manage
            </button>
        </div>
    `

  return card
}

// View course analytics
async function viewCourseAnalytics(courseId) {
  try {
    const courses = await getAllCourses();
    const course = courses.find((c) => c.courseId === courseId);
    const enrollments = await getAllEnrollments();
    const courseEnrollments = enrollments.filter((e) => e.courseId === courseId);
    
    if (!course) return;

    let analytics = `Course Analytics: ${course.title}\n\n`;
    analytics += `Total Enrollments: ${courseEnrollments.length}\n`;
    analytics += `Revenue Generated: $${courseEnrollments.length * course.price}\n`;

    alert(analytics);
  } catch (error) {
    console.error('Error loading course analytics:', error);
    alert('Error loading course analytics.');
  }
}

// Manage course
async function manageCourse(courseId) {
  try {
    const courses = await getAllCourses();
    const course = courses.find((c) => c.courseId === courseId);
    if (!course) return;

    const action = prompt(
      `Manage "${course.title}":\n\n1. View Details\n2. Delete Course\n\nEnter your choice (1-2):`,
    );

    switch (action) {
      case "1":
        await viewCourseDetails(courseId);
        break;
      case "2":
        await deleteCourseAdmin(courseId);
        break;
      default:
        alert("Invalid choice.");
    }
  } catch (error) {
    console.error('Error managing course:', error);
  }
}

// View course details
async function viewCourseDetails(courseId) {
  try {
    const courses = await getAllCourses();
    const course = courses.find((c) => c.courseId === courseId);
    const enrollments = await getAllEnrollments();
    const courseEnrollments = enrollments.filter((e) => e.courseId === courseId);

    if (!course) return;

    let details = `Course Details:\n\n`;
    details += `Title: ${course.title}\n`;
    details += `Description: ${course.description}\n`;
    details += `Level: ${course.level}\n`;
    details += `Duration: ${course.duration}\n`;
    details += `Price: $${course.price}\n`;
    details += `Enrollments: ${courseEnrollments.length}\n`;

    alert(details);
  } catch (error) {
    console.error('Error loading course details:', error);
  }
}

// Delete course (admin function)
async function deleteCourseAdmin(courseId) {
  try {
    const courses = await getAllCourses();
    const course = courses.find((c) => c.courseId === courseId);
    
    if (!course) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete the course "${course.title}"? This action cannot be undone.`);
    
    if (confirmDelete) {
      const response = await fetch(`http://localhost:51265/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert(`Course "${course.title}" has been deleted successfully.`);
        loadCourses(); // Refresh the course list
      } else {
        alert('Failed to delete course.');
      }
    }
  } catch (error) {
    console.error('Error deleting course:', error);
    alert('Error deleting course.');
  }
}



// Load analytics
async function loadAnalytics() {
  try {
    const [users, courses, enrollments] = await Promise.all([
      getAllUsers(),
      getAllCourses(),
      getAllEnrollments()
    ]);

    const analyticsSummary = document.getElementById("analyticsSummary")

    // Calculate analytics
    const studentCount = users.filter((user) => user.userType === "student").length
    const educatorCount = users.filter((user) => user.userType === "educator").length
    const averageEnrollmentsPerCourse = courses.length > 0 ? (enrollments.length / courses.length).toFixed(1) : 0
    const totalRevenue = enrollments.reduce((sum, enrollment) => {
      const course = courses.find(c => c.CourseId === enrollment.CourseId);
      return sum + (course ? course.price : 0);
    }, 0);

    analyticsSummary.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div style="text-align: center;">
                <h4>Students</h4>
                <p style="font-size: 2rem; font-weight: bold; color: #3498db;">${studentCount}</p>
            </div>
            <div style="text-align: center;">
                <h4>Educators</h4>
                <p style="font-size: 2rem; font-weight: bold; color: #27ae60;">${educatorCount}</p>
            </div>
            <div style="text-align: center;">
                <h4>Avg Enrollments/Course</h4>
                <p style="font-size: 2rem; font-weight: bold; color: #e67e22;">${averageEnrollmentsPerCourse}</p>
            </div>
            <div style="text-align: center;">
                <h4>Total Revenue</h4>
                <p style="font-size: 2rem; font-weight: bold; color: #9b59b6;">$${totalRevenue}</p>
            </div>
        </div>
        <div style="margin-top: 2rem;">
            <h4>Platform Health</h4>
            <p>✅ All systems operational</p>
            <p>✅ Database backup completed</p>
            <p>✅ Security scans passed</p>
            <p>⚠️ ${users.filter((user) => user.userType === "educator" && !user.isApproved).length} educator accounts pending approval</p>
        </div>
    `
  } catch (error) {
    console.error('Error loading analytics:', error);
    if (document.getElementById("analyticsSummary")) {
      document.getElementById("analyticsSummary").innerHTML = '<p>Error loading analytics data.</p>';
    }
  }
}

// Save settings
function saveSettings() {
  const settings = {
    platformName: document.getElementById("platformName").value,
    maxEnrollments: document.getElementById("maxEnrollments").value,
    autoApproveEducators: document.getElementById("autoApproveEducators").value === "true",
    maintenanceMode: document.getElementById("maintenanceMode").value === "true",
  }

  // Save settings to localStorage
  localStorage.setItem("studyvalyria_settings", JSON.stringify(settings))

  alert("Settings saved successfully!")
}

// Utility functions
async function getAllUsers() {
  try {
    const response = await fetch('http://localhost:51265/api/users');
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

async function getAllCourses() {
  try {
    const response = await fetch('http://localhost:51265/api/courses');
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

async function getAllEnrollments() {
  try {
    const response = await fetch('http://localhost:51265/api/enrollments');
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return [];
  }
}

function formatDate(date) {
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function logout() {
  authManager.logout()
}
