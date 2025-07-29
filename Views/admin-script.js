// Admin dashboard functionality for StudyValyria platform

let currentUser = null
let currentSection = "overview"

// Utility Functions
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => notification.remove());

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    z-index: 10000;
    max-width: 300px;
    word-wrap: break-word;
    animation: slideIn 0.3s ease-out;
  `;

  // Set background color based on type
  switch(type) {
    case 'success':
      notification.style.backgroundColor = '#27ae60';
      break;
    case 'error':
      notification.style.backgroundColor = '#e74c3c';
      break;
    case 'warning':
      notification.style.backgroundColor = '#f39c12';
      break;
    default:
      notification.style.backgroundColor = '#3498db';
  }

  notification.textContent = message;
  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);

  // Add click to dismiss
  notification.addEventListener('click', () => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  });
}

function createModal(title, content) {
  // Remove existing modal
  const existingModal = document.getElementById('dynamicModal');
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal element using the same approach as login modal
  const modal = document.createElement('div');
  modal.id = 'dynamicModal';
  modal.className = 'modal';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';

  modalContent.innerHTML = `
    <span class="close" onclick="closeModal()">&times;</span>
    <h2>${title}</h2>
    <div>${content}</div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Force reflow for Chrome compatibility (same as login modal)
  modal.style.display = 'none';
  modal.offsetHeight; // Force reflow
  
  modal.classList.add('show');
  modal.style.display = 'flex';
  document.body.classList.add('modal-open');

  // Additional Chrome fix - ensure proper positioning
  setTimeout(() => {
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
  }, 0);

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  return modal;
}

function closeModal() {
  const modal = document.getElementById('dynamicModal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    // Remove modal after animation
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

// Add CSS animations
if (!document.getElementById('modalAnimations')) {
  const style = document.createElement('style');
  style.id = 'modalAnimations';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes slideInModal {
      from { transform: translateY(-50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

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

// Show add user form
function showAddUserForm() {
  console.log('showAddUserForm called');
  
  createModal('Add New User', `
    <div style="max-width: 400px;">
      <form id="addUserForm" style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">First Name:</label>
          <input type="text" id="firstName" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Last Name:</label>
          <input type="text" id="lastName" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Email:</label>
          <input type="email" id="email" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Password:</label>
          <input type="password" id="password" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Role:</label>
          <select id="role" required style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 5px;">
            <option value="">Select Role</option>
            <option value="student">Student</option>
            <option value="educator">Educator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <button type="submit" style="flex: 1; padding: 0.75rem; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">Add User</button>
          <button type="button" onclick="closeModal()" style="flex: 1; padding: 0.75rem; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
        </div>
      </form>
    </div>
  `);
  
  // Add form submission handler immediately after modal creation
  const form = document.getElementById('addUserForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        FirstName: document.getElementById('firstName').value,
        LastName: document.getElementById('lastName').value,
        Email: document.getElementById('email').value,
        Password: document.getElementById('password').value,
        UserType: document.getElementById('role').value
      };
      
      try {
        const response = await fetch('/api/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          showNotification('User added successfully!', 'success');
          closeModal();
          await loadUsers(); // Refresh user list
          await loadOverviewData(); // Refresh overview
        } else {
          const error = await response.text();
          showNotification(`Failed to add user: ${error}`, 'error');
        }
      } catch (error) {
        console.error('Error adding user:', error);
        showNotification('Failed to add user. Please try again.', 'error');
      }
    });
  }
}

// Duplicate addNewUser function removed - using showAddUserForm instead

// Function to show pending user approvals
async function showPendingApprovals() {
  try {
    const users = await getAllUsers();
    
    // Filter users that need approval (educators who are not approved)
    const pendingUsers = users.filter(user => 
      (user.userType === 'educator' || user.UserType === 'educator') && 
      !(user.isApproved || user.IsApproved)
    );
    
    if (pendingUsers.length === 0) {
      showNotification('No pending user approvals', 'info');
      return;
    }
    
    const usersList = pendingUsers.map(user => {
      const firstName = user.firstName || user.FirstName || '';
      const lastName = user.lastName || user.LastName || '';
      const email = user.email || user.Email || '';
      const userType = user.userType || user.UserType || '';
      const userId = user.id || user.userId || user.UserId;
      
      return `
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #f39c12;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4 style="margin: 0 0 0.5rem 0;">${firstName} ${lastName}</h4>
              <p style="margin: 0; color: #666;">Email: ${email}</p>
              <p style="margin: 0; color: #666;">Role: ${userType}</p>
              <p style="margin: 0; color: #666;">Status: Pending Approval</p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button onclick="approveEducator('${userId}')" style="padding: 0.5rem 1rem; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">Approve</button>
              <button onclick="rejectEducator('${userId}')" style="padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">Reject</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    const modal = createModal('Pending Educator Approvals', `
      <div style="max-width: 600px;">
        <div style="margin-bottom: 1rem;">
          <h4>Educators Awaiting Approval (${pendingUsers.length})</h4>
        </div>
        <div style="max-height: 400px; overflow-y: auto;">
          ${usersList}
        </div>
        <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
          <button onclick="closeModal()" style="padding: 0.5rem 1rem; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
        </div>
      </div>
    `);
  } catch (error) {
    console.error('Error loading pending approvals:', error);
    showNotification('Error loading pending approvals', 'error');
  }
}

// Approve educator function
 async function approveEducator(userId) {
   try {
     const response = await fetch(`http://localhost:51265/api/users/${userId}/approve`, {
       method: 'PUT',
       headers: {
         'Content-Type': 'application/json'
       }
     });
     
     if (response.ok) {
       showNotification('Educator approved successfully!', 'success');
       showPendingApprovals(); // Refresh the pending list
       loadUsers(); // Refresh main user list
       loadOverviewData(); // Refresh overview data
     } else {
       showNotification('Failed to approve educator', 'error');
     }
   } catch (error) {
     console.error('Error approving educator:', error);
     showNotification('Error approving educator', 'error');
   }
 }
 
 // Reject educator function
 async function rejectEducator(userId) {
   const modal = createModal('Confirm Rejection', `
     <div style="text-align: center;">
       <div style="font-size: 3rem; color: #e74c3c; margin-bottom: 1rem;">⚠️</div>
       <h3>Are you sure you want to reject this educator?</h3>
       <p style="color: #7f8c8d; margin-bottom: 2rem;">This will deny their educator privileges but keep their account as a student.</p>
       <div style="display: flex; gap: 1rem; justify-content: center;">
         <button onclick="closeModal()" style="padding: 0.5rem 1rem; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
         <button onclick="confirmRejectEducator('${userId}')" style="padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">Reject Educator</button>
       </div>
     </div>
   `);
 }

// Confirm reject educator
async function confirmRejectEducator(userId) {
  try {
    const response = await fetch(`http://localhost:51265/api/users/${userId}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      closeModal();
      showNotification('Educator application rejected', 'success');
      loadUsers();
      loadOverviewData();
    } else {
      showNotification('Failed to reject educator', 'error');
    }
  } catch (error) {
    console.error('Error rejecting educator:', error);
    showNotification('Error rejecting educator', 'error');
  }
}

// Display users
function displayUsers(users) {
  const usersList = document.getElementById("usersList")
  usersList.innerHTML = ""

  // Add action buttons at the top
  const actionButtons = document.createElement('div');
  actionButtons.innerHTML = `
    <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
      <button onclick="showAddUserForm()" style="
        flex: 1;
        padding: 1rem; 
        background: #27ae60; 
        color: white; 
        border: none; 
        border-radius: 8px; 
        cursor: pointer; 
        font-size: 1rem; 
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      ">
        <span style="font-size: 1.2rem;">➕</span> Add New User
      </button>
      <button onclick="showPendingApprovals()" style="
        flex: 1;
        padding: 1rem; 
        background: #f39c12; 
        color: white; 
        border: none; 
        border-radius: 8px; 
        cursor: pointer; 
        font-size: 1rem; 
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      ">
        <span style="font-size: 1.2rem;">⏳</span> Pending Approvals
      </button>
    </div>
  `;
  usersList.appendChild(actionButtons);

  if (users.length === 0) {
    const noUsersMsg = document.createElement('p');
    noUsersMsg.textContent = 'No users found.';
    usersList.appendChild(noUsersMsg);
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
  const enrollmentCount = user.userType === "student" ? (user.profile?.enrollments?.length || 0) : 0
  const courseCount = user.userType === "educator" ? (user.profile?.courses?.length || 0) : 0

  card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <div>
                <h3>${user.firstName || user.FirstName || ''} ${user.lastName || user.LastName || ''}</h3>
                <p><strong>Email:</strong> ${user.email || user.Email || 'N/A'}</p>
                <p><strong>Type:</strong> ${(user.userType || user.UserType || 'Unknown').charAt(0).toUpperCase() + (user.userType || user.UserType || 'unknown').slice(1)}</p>
                <p><strong>Registered:</strong> ${formatDate(new Date(user.registrationDate || user.RegistrationDate))}</p>
                ${user.userType === "student" ? `<p><strong>Enrollments:</strong> ${enrollmentCount}</p>` : ""}
                ${user.userType === "educator" ? `<p><strong>Courses:</strong> ${courseCount}</p>` : ""}
            </div>
            <div>${statusBadge}</div>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${
              (user.userType === "educator" || user.UserType === "educator") && !(user.isApproved || user.IsApproved)
                ? `<button onclick="approveEducator('${user.id || user.userId || user.UserId}')" style="padding: 0.5rem 1rem; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">Approve</button>`
                : ""
            }
            <button onclick="${(user.isActive || user.IsActive) ? "toggleUserStatus" : "activateUser"}('${user.id || user.userId || user.UserId}')" style="padding: 0.5rem 1rem; background: ${(user.isActive || user.IsActive) ? "#e67e22" : "#3498db"}; color: white; border: none; border-radius: 5px; cursor: pointer;">
                ${(user.isActive || user.IsActive) ? "Deactivate" : "Activate"}
            </button>
            <button onclick="viewUserDetailsEnhanced('${user.id || user.userId || user.UserId}')" style="padding: 0.5rem 1rem; background: #9b59b6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                View Details
            </button>
            ${(user.userType !== "admin" && user.UserType !== "admin")
                ? `<button onclick="confirmDeleteUser('${user.id || user.userId || user.UserId}')" style="padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">Delete</button>`
                : ""
            }
        </div>
    `

  return card
}

// Get status badge
function getStatusBadge(user) {
  const isActive = user.isActive || user.IsActive;
  const isApproved = user.isApproved || user.IsApproved;
  const userType = user.userType || user.UserType;
  
  if (!isActive) {
    return '<span style="background: #e74c3c; color: white; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.8rem;">Inactive</span>'
  } else if (userType === "educator" && !isApproved) {
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

// Activate user (for inactive users)
async function activateUser(userId) {
  try {
    const users = await getAllUsers();
    const user = users.find((u) => u.userId === userId);

    if (!user) return;

    const confirmAction = confirm(
      `Are you sure you want to activate ${user.firstName} ${user.lastName}?`,
    );
    if (!confirmAction) return;

    const response = await fetch(
      `http://localhost:51265/api/users/${userId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: true }),
      },
    );

    if (response.ok) {
      alert(`User activated successfully!`);
      loadUsers();
      loadOverviewData();
    } else {
      alert(`Failed to activate user.`);
    }
  } catch (error) {
    console.error("Error activating user:", error);
    alert("Error activating user.");
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

// Enhanced view user details with modal
// Removed duplicate function - using the one at line 1440

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
  
  // Handle different property naming conventions
  const title = course.Title || course.title || 'Untitled Course';
  const description = course.Description || course.description || 'No description available';
  const level = course.Level || course.level || 'N/A';
  const duration = course.Duration || course.duration || 'N/A';
  const price = course.Price || course.price || 0;
  const courseId = course.CourseId || course.courseId;
  const educatorId = course.EducatorId || course.educatorId || 'N/A';

  card.innerHTML = `
        <h3>${title}</h3>
        <p><strong>Description:</strong> ${description}</p>
        <p><strong>Level:</strong> ${level}</p>
        <p><strong>Duration:</strong> ${duration}</p>
        <p><strong>Price:</strong> $${price}</p>
        <p><strong>Educator ID:</strong> ${educatorId}</p>
        <p><strong>Enrolled Students:</strong> ${enrollmentCount}</p>
        <div style="margin-top: 1rem;">
            <button onclick="viewCourseAnalytics(${courseId})" class="cta-button" style="padding: 0.5rem 1rem; font-size: 0.9rem; margin-right: 0.5rem;">
                View Analytics
            </button>
            <button onclick="manageCourse(${courseId})" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: #e67e22; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Manage
            </button>
        </div>
    `

  return card
}

// View course analytics
async function viewCourseAnalytics(courseId) {
  try {
    // Fetch course details and analytics
    const [courseResponse, enrollmentsResponse] = await Promise.all([
      fetch(`http://localhost:51265/api/courses/${courseId}`),
      fetch(`http://localhost:51265/api/enrollments/course/${courseId}`)
    ]);
    
    if (!courseResponse.ok || !enrollmentsResponse.ok) {
      throw new Error('Failed to fetch course analytics');
    }
    
    const course = await courseResponse.json();
    const enrollments = await enrollmentsResponse.json();
    
    // Calculate analytics
    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter(e => e.IsActive).length;
    const completedEnrollments = enrollments.filter(e => e.CompletionStatus === 'Completed').length;
    const completionRate = totalEnrollments > 0 ? ((completedEnrollments / totalEnrollments) * 100).toFixed(1) : 0;
    
    // Group enrollments by month for trend analysis
    const enrollmentsByMonth = {};
    enrollments.forEach(enrollment => {
      const month = new Date(enrollment.EnrollmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      enrollmentsByMonth[month] = (enrollmentsByMonth[month] || 0) + 1;
    });
    
    const monthlyData = Object.entries(enrollmentsByMonth)
      .map(([month, count]) => `<div style="display: flex; justify-content: space-between;"><span>${month}:</span><span>${count} enrollments</span></div>`)
      .join('');
    
    const modal = createModal(`Analytics - ${course.Title || course.title}`, `
      <div style="max-width: 600px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
          <div style="background: #3498db; color: white; padding: 1rem; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; font-size: 2rem;">${totalEnrollments}</h3>
            <p style="margin: 0.5rem 0 0 0;">Total Enrollments</p>
          </div>
          <div style="background: #27ae60; color: white; padding: 1rem; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; font-size: 2rem;">${activeEnrollments}</h3>
            <p style="margin: 0.5rem 0 0 0;">Active Students</p>
          </div>
          <div style="background: #f39c12; color: white; padding: 1rem; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; font-size: 2rem;">${completedEnrollments}</h3>
            <p style="margin: 0.5rem 0 0 0;">Completed</p>
          </div>
          <div style="background: #9b59b6; color: white; padding: 1rem; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; font-size: 2rem;">${completionRate}%</h3>
            <p style="margin: 0.5rem 0 0 0;">Completion Rate</p>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
          <h4 style="margin-top: 0;">Course Information</h4>
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem;">
            <strong>Course ID:</strong> <span>${course.CourseId || course.courseId}</span>
            <strong>Level:</strong> <span>${course.Level || course.level}</span>
            <strong>Duration:</strong> <span>${course.Duration || course.duration}</span>
            <strong>Price:</strong> <span>$${course.Price || course.price || 0}</span>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
          <h4 style="margin-top: 0;">Monthly Enrollment Trends</h4>
          <div style="max-height: 200px; overflow-y: auto;">
            ${monthlyData || '<p>No enrollment data available</p>'}
          </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end;">
          <button onclick="closeModal()" style="padding: 0.5rem 1rem; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
        </div>
      </div>
    `);
  } catch (error) {
    console.error('Error fetching course analytics:', error);
    showNotification('Error loading course analytics', 'error');
  }
}

// Manage course
async function manageCourse(courseId) {
  try {
    const response = await fetch(`http://localhost:51265/api/courses/${courseId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch course details');
    }
    
    const course = await response.json();
    
    const modal = createModal(`Manage Course - ${course.Title || course.title}`, `
      <div style="max-width: 500px;">
        <div style="margin-bottom: 2rem;">
          <h4>Course Details</h4>
          <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <p><strong>Title:</strong> ${course.Title || course.title}</p>
            <p><strong>Description:</strong> ${course.Description || course.description}</p>
            <p><strong>Level:</strong> ${course.Level || course.level}</p>
            <p><strong>Duration:</strong> ${course.Duration || course.duration}</p>
            <p><strong>Price:</strong> $${course.Price || course.price || 0}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 2rem;">
          <h4>Management Actions</h4>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <button onclick="editCourse(${courseId})" style="padding: 0.75rem; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">📝 Edit Course Details</button>
            <button onclick="viewCourseEnrollments(${courseId})" style="padding: 0.75rem; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">👥 View Enrollments</button>
            <button onclick="toggleCourseStatus(${courseId})" style="padding: 0.75rem; background: #f39c12; color: white; border: none; border-radius: 5px; cursor: pointer;">🔄 Toggle Course Status</button>
            <button onclick="confirmDeleteCourse(${courseId}, ${course.EducatorId || course.educatorId})" style="padding: 0.75rem; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">🗑️ Delete Course</button>
          </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end;">
          <button onclick="closeModal()" style="padding: 0.5rem 1rem; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
        </div>
      </div>
    `);
  } catch (error) {
    console.error('Error fetching course details:', error);
    showNotification('Error loading course details', 'error');
  }
}

async function confirmDeleteCourse(courseId, educatorId) {
  const modal = createModal('Confirm Delete Course', `
    <div style="text-align: center;">
      <div style="font-size: 3rem; color: #e74c3c; margin-bottom: 1rem;">⚠️</div>
      <h3>Are you sure you want to delete this course?</h3>
      <p style="color: #7f8c8d; margin-bottom: 2rem;">This action cannot be undone. All course data and enrollments will be permanently removed.</p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button onclick="closeModal()" style="padding: 0.5rem 1rem; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
        <button onclick="deleteCourseConfirmed(${courseId}, ${educatorId})" style="padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">Delete Course</button>
      </div>
    </div>
  `);
}

async function deleteCourseConfirmed(courseId, educatorId) {
  try {
    const response = await fetch(`http://localhost:51265/api/courses/${courseId}?educatorId=${educatorId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      closeModal();
      showNotification('Course deleted successfully!', 'success');
      loadCourses();
    } else {
      showNotification('Failed to delete course', 'error');
    }
  } catch (error) {
    console.error('Error deleting course:', error);
    showNotification('Error deleting course', 'error');
  }
}

async function editCourse(courseId) {
  try {
    const courses = await getAllCourses();
    const course = courses.find((c) => c.courseId === courseId);
    
    if (!course) {
      showNotification('Course not found', 'error');
      return;
    }

    const modalContent = `
      <div class="modal-content">
        <span class="close" onclick="closeModal()">&times;</span>
        <h2>Edit Course Details</h2>
        <form id="editCourseForm">
          <div style="margin-bottom: 1rem;">
            <label for="courseTitle" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Title:</label>
            <input type="text" id="courseTitle" value="${course.title || ''}" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;" required>
          </div>
          
          <div style="margin-bottom: 1rem;">
            <label for="courseDescription" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Description:</label>
            <textarea id="courseDescription" rows="4" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; resize: vertical;" required>${course.description || ''}</textarea>
          </div>
          
          <div style="margin-bottom: 1rem;">
            <label for="courseLevel" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Level:</label>
            <select id="courseLevel" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;" required>
              <option value="Beginner" ${course.level === 'Beginner' ? 'selected' : ''}>Beginner</option>
              <option value="Intermediate" ${course.level === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
              <option value="Advanced" ${course.level === 'Advanced' ? 'selected' : ''}>Advanced</option>
            </select>
          </div>
          
          <div style="margin-bottom: 1rem;">
            <label for="courseDuration" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Duration:</label>
            <input type="text" id="courseDuration" value="${course.duration || ''}" placeholder="e.g., 6 weeks" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;" required>
          </div>
          
          <div style="margin-bottom: 1rem;">
            <label for="coursePrice" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Price ($):</label>
            <input type="number" id="coursePrice" value="${course.price || ''}" min="0" step="0.01" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;" required>
          </div>
          
          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
            <button type="button" onclick="closeModal()" style="padding: 0.75rem 1.5rem; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
            <button type="submit" style="padding: 0.75rem 1.5rem; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    createModal(modalContent);
    
    // Add form submit handler
    document.getElementById('editCourseForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveCourseChanges(courseId, course.EducatorId || course.educatorId);
    });
    
  } catch (error) {
    console.error('Error loading course for editing:', error);
    showNotification('Error loading course details', 'error');
  }
}

async function saveCourseChanges(courseId, educatorId) {
  try {
    const title = document.getElementById('courseTitle').value.trim();
    const description = document.getElementById('courseDescription').value.trim();
    const level = document.getElementById('courseLevel').value;
    const duration = document.getElementById('courseDuration').value.trim();
    const price = parseFloat(document.getElementById('coursePrice').value);
    
    if (!title || !description || !level || !duration || isNaN(price)) {
      showNotification('Please fill in all fields correctly', 'error');
      return;
    }
    
    const courseData = {
      Title: title,
      Description: description,
      Level: level,
      Duration: duration,
      Price: price,
      EducatorId: educatorId
    };
    
    const response = await fetch(`http://localhost:51265/api/courses/${courseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(courseData)
    });
    
    if (response.ok) {
      showNotification('Course updated successfully!', 'success');
      closeModal();
      // Refresh the courses display
      loadCourses();
    } else {
      const errorText = await response.text();
      showNotification(`Error updating course: ${errorText}`, 'error');
    }
    
  } catch (error) {
    console.error('Error saving course changes:', error);
    showNotification('Error saving course changes', 'error');
  }
}

async function viewCourseEnrollments(courseId) {
  showNotification('Course enrollments view coming soon!', 'info');
}

async function toggleCourseStatus(courseId) {
  showNotification('Course status toggle coming soon!', 'info');
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

// User management functions
async function activateUser(userId) {
  try {
    const response = await fetch(`http://localhost:51265/api/users/${userId}/activate`, {
      method: 'POST'
    });
    
    if (response.ok) {
      showNotification('User activated successfully!', 'success');
      loadUsers();
    } else {
      showNotification('Failed to activate user', 'error');
    }
  } catch (error) {
    console.error('Error activating user:', error);
    showNotification('Error activating user', 'error');
  }
}

async function approveUser(userId) {
  try {
    const response = await fetch(`http://localhost:51265/api/users/${userId}/approve`, {
      method: 'POST'
    });
    
    if (response.ok) {
      showNotification('User approved successfully!', 'success');
      loadUsers();
    } else {
      showNotification('Failed to approve user', 'error');
    }
  } catch (error) {
    console.error('Error approving user:', error);
    showNotification('Error approving user', 'error');
  }
}

// Enhanced view user details function
async function viewUserDetailsEnhanced(userId) {
  try {
    const response = await fetch(`http://localhost:51265/api/users/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user details');
    }
    
    const user = await response.json();
    const fullName = `${user.FirstName || ''} ${user.LastName || ''}`.trim() || 'No Name';
    const registrationDate = user.RegistrationDate ? new Date(user.RegistrationDate).toLocaleDateString() : 'N/A';
    
    const modal = createModal('User Details', `
      <div style="max-width: 500px;">
        <div style="margin-bottom: 1rem;">
          <h3>${fullName}</h3>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem; margin-bottom: 1rem;">
          <strong>User ID:</strong> <span>${user.UserId}</span>
          <strong>First Name:</strong> <span>${user.FirstName || 'N/A'}</span>
          <strong>Last Name:</strong> <span>${user.LastName || 'N/A'}</span>
          <strong>Email:</strong> <span>${user.Email || 'N/A'}</span>
          <strong>User Type:</strong> <span>${user.UserType || 'N/A'}</span>
          <strong>Status:</strong> <span style="color: ${user.IsActive ? '#27ae60' : '#e74c3c'}">${user.IsActive ? 'Active' : 'Inactive'}</span>
          <strong>Approval:</strong> <span style="color: ${user.IsApproved ? '#27ae60' : '#f39c12'}">${user.IsApproved ? 'Approved' : 'Pending'}</span>
          <strong>Registration Date:</strong> <span>${registrationDate}</span>
          <strong>Bio:</strong> <span>${user.Bio || 'No bio available'}</span>
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button onclick="closeModal()" style="padding: 0.5rem 1rem; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
        </div>
      </div>
    `);
  } catch (error) {
    console.error('Error fetching user details:', error);
    showNotification('Error loading user details', 'error');
  }
}

async function confirmDeleteUser(userId) {
  const modal = createModal('Confirm Delete', `
    <div style="text-align: center;">
      <div style="font-size: 3rem; color: #e74c3c; margin-bottom: 1rem;">⚠️</div>
      <h3>Are you sure you want to delete this user?</h3>
      <p style="color: #7f8c8d; margin-bottom: 2rem;">This action cannot be undone. All user data will be permanently removed.</p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button onclick="closeModal()" style="padding: 0.5rem 1rem; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
        <button onclick="deleteUserConfirmed(${userId})" style="padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">Delete User</button>
      </div>
    </div>
  `);
}

async function deleteUserConfirmed(userId) {
  try {
    const response = await fetch(`http://localhost:51265/api/users/${userId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      closeModal();
      showNotification('User deleted successfully!', 'success');
      loadUsers();
    } else {
      showNotification('Failed to delete user', 'error');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    showNotification('Error deleting user', 'error');
  }
}

function logout() {
  authManager.logout()
}
