# StudyValyria - Digital Learning Platform

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Documentation](#backend-documentation)
4. [Frontend Documentation](#frontend-documentation)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [User Roles & Permissions](#user-roles--permissions)
8. [Setup & Installation](#setup--installation)
9. [Features](#features)
10. [Security](#security)

## Overview

StudyValyria is a comprehensive digital learning platform built with ASP.NET Web API backend and vanilla JavaScript frontend. The platform supports three user types: Students, Educators, and Administrators, each with role-specific dashboards and functionality.

### Key Features
- User authentication and authorization
- Course management and enrollment
- Interactive quizzes and assessments
- Progress tracking and analytics
- Activity logging and monitoring
- Contact form and messaging
- Responsive web design

## Architecture

### Technology Stack
- **Backend**: ASP.NET Web API (.NET Framework 4.8.1)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: SQL Server
- **Authentication**: Custom JWT-like session management
- **Styling**: Custom CSS with responsive design

### Project Structure
```
WAPPAssignment/
├── Controllers/           # Web API Controllers
├── App_Start/            # Application configuration
├── Views/                # Frontend files (HTML, CSS, JS)
├── Properties/           # Assembly information
├── DatabaseSetup.sql     # Database schema and sample data
├── Web.config           # Application configuration
└── Global.asax          # Application lifecycle events
```

## Backend Documentation

### Controllers Overview

The backend follows RESTful API principles with the following controllers:

#### 1. AuthController
**Purpose**: Handles user authentication
- `POST /api/auth/login` - User login with email/password validation
- Returns user data on successful authentication
- Validates credentials against database

#### 2. UsersController
**Purpose**: User management operations
- `GET /api/users` - Retrieve all users (admin only)
- `GET /api/users/{id}` - Get specific user details
- `POST /api/users` - Create new user account
- `PUT /api/users/{id}` - Update user profile
- `DELETE /api/users/{id}` - Delete user account
- `GET /api/users/check-email` - Check email availability
- `PUT /api/users/{id}/approve` - Approve educator accounts
- `PUT /api/users/{id}/status` - Update user status

#### 3. CoursesController
**Purpose**: Course management
- `GET /api/courses` - List all courses
- `GET /api/courses/{id}` - Get course details
- `POST /api/courses` - Create new course (educators)
- `PUT /api/courses/{id}` - Update course information
- `DELETE /api/courses/{id}` - Delete course
- `GET /api/courses/educator/{educatorId}` - Get courses by educator

#### 4. EnrollmentsController
**Purpose**: Student course enrollments
- `GET /api/enrollments` - Get all enrollments
- `GET /api/enrollments/student/{studentId}` - Student's enrollments
- `GET /api/enrollments/course/{courseId}` - Course enrollment list
- `POST /api/enrollments` - Enroll student in course
- `DELETE /api/enrollments/{id}` - Unenroll from course

#### 5. QuizResultsController
**Purpose**: Quiz and assessment management
- `GET /api/quizzes/questions/{courseId}` - Get quiz questions for course
- `GET /api/quizzes/results/user/{userId}` - User's quiz results
- `POST /api/quizzes/results` - Submit quiz results

#### 6. ActivityController
**Purpose**: Activity tracking and analytics
- `GET /api/activity/user/{userId}` - User-specific activities
- `GET /api/activity/system` - System-wide activities
- `GET /api/activity/study-hours/{userId}` - Calculate study hours
- `POST /api/activity/log` - Log custom activities

#### 7. ContactController
**Purpose**: Contact form submissions
- `POST /api/contact` - Submit contact messages

### Database Connection
The backend uses SQL Server with connection string configured in `Web.config`. All controllers use `SqlConnection` for database operations with proper error handling and resource disposal.

### Error Handling
- Controllers implement try-catch blocks
- Returns appropriate HTTP status codes
- Provides meaningful error messages
- Logs errors for debugging

## Frontend Documentation

### File Structure
```
Views/
├── index.html              # Landing page
├── login.html              # Login page
├── register.html           # Registration page
├── student-dashboard.html  # Student interface
├── educator-dashboard.html # Educator interface
├── admin-dashboard.html    # Admin interface
├── styles.css              # Global styles
├── guest-script.js         # Landing page functionality
├── login-script.js         # Login functionality
├── register-script.js      # Registration functionality
├── student-script.js       # Student dashboard logic
├── educator-script.js      # Educator dashboard logic
└── admin-script.js         # Admin dashboard logic
```

### Frontend Architecture

#### 1. Landing Page (index.html)
- Course browsing for guests
- Contact form
- Navigation to login/register
- Responsive course grid display

#### 2. Authentication Pages
**Login (login.html)**
- Email/password validation
- Demo account information
- Error handling and display
- Automatic redirection based on user role

**Registration (register.html)**
- Multi-step form validation
- Real-time email availability checking
- Password strength validation
- Role selection (Student/Educator)

#### 3. Dashboard Pages

**Student Dashboard**
- Overview with statistics (enrolled courses, quiz scores, study hours)
- Course enrollment and management
- Quiz taking interface with detailed results
- Profile management
- Progress tracking

**Educator Dashboard**
- Teaching overview (created courses, total students, revenue)
- Course creation and management
- Student enrollment monitoring
- Profile management with bio
- Course analytics

**Admin Dashboard**
- Platform overview (total users, courses, enrollments)
- User management (approve, activate, delete)
- Course oversight
- System analytics
- Platform settings

### JavaScript Architecture

#### Common Patterns
1. **Initialization**: Each dashboard checks user authentication and role
2. **API Communication**: Fetch API for all backend communication
3. **Error Handling**: Try-catch blocks with user-friendly error messages
4. **Local Storage**: Session management and temporary data storage
5. **Dynamic Content**: DOM manipulation for real-time updates

#### Key Functions

**Authentication Flow**
```javascript
// Check user session
currentUser = JSON.parse(localStorage.getItem("studyvalyria_current_user"))

// Validate user role
if (!currentUser || currentUser.userType !== "expected_role") {
    window.location.href = "login.html"
}
```

**API Communication Pattern**
```javascript
try {
    const response = await fetch(`http://localhost:51264/api/endpoint`)
    if (!response.ok) throw new Error('API call failed')
    const data = await response.json()
    // Process data
} catch (error) {
    console.error('Error:', error)
    // Show user-friendly error
}
```

## Database Schema

### Tables

#### Users
```sql
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    UserType NVARCHAR(20) NOT NULL,
    Bio NVARCHAR(500),
    RegistrationDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    IsApproved BIT DEFAULT 0
)
```

#### Courses
```sql
CREATE TABLE Courses (
    CourseId INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    Duration NVARCHAR(50),
    Level NVARCHAR(20),
    Price DECIMAL(10,2),
    EducatorId INT,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (EducatorId) REFERENCES Users(UserId)
)
```

#### Enrollments
```sql
CREATE TABLE Enrollments (
    EnrollmentId INT IDENTITY(1,1) PRIMARY KEY,
    StudentId INT,
    CourseId INT,
    EnrollmentDate DATETIME DEFAULT GETDATE(),
    Progress DECIMAL(5,2) DEFAULT 0,
    FOREIGN KEY (StudentId) REFERENCES Users(UserId),
    FOREIGN KEY (CourseId) REFERENCES Courses(CourseId)
)
```

#### QuizResults
```sql
CREATE TABLE QuizResults (
    ResultId INT IDENTITY(1,1) PRIMARY KEY,
    StudentId INT,
    CourseId INT,
    Score INT,
    Date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (StudentId) REFERENCES Users(UserId),
    FOREIGN KEY (CourseId) REFERENCES Courses(CourseId)
)
```

#### QuizQuestions
```sql
CREATE TABLE QuizQuestions (
    QuestionId INT IDENTITY(1,1) PRIMARY KEY,
    CourseId INT,
    Question NVARCHAR(500),
    OptionA NVARCHAR(200),
    OptionB NVARCHAR(200),
    OptionC NVARCHAR(200),
    OptionD NVARCHAR(200),
    CorrectAnswer INT,
    FOREIGN KEY (CourseId) REFERENCES Courses(CourseId)
)
```

#### Activities
```sql
CREATE TABLE Activities (
    ActivityId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT,
    Type NVARCHAR(50),
    Message NVARCHAR(500),
    Date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
)
```

#### ActivityLogs
```sql
CREATE TABLE ActivityLogs (
    ActivityLogId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT,
    Type NVARCHAR(50),
    Message NVARCHAR(500),
    Date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
)
```

#### ContactMessages
```sql
CREATE TABLE ContactMessages (
    MessageId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100),
    Email NVARCHAR(100),
    Message NVARCHAR(1000),
    SubmittedDate DATETIME DEFAULT GETDATE()
)
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### User Management
- `GET /api/users` - List users
- `GET /api/users/{id}` - Get user
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user
- `GET /api/users/check-email?email={email}` - Check email
- `PUT /api/users/{id}/approve` - Approve user
- `PUT /api/users/{id}/status` - Update status

### Course Management
- `GET /api/courses` - List courses
- `GET /api/courses/{id}` - Get course
- `POST /api/courses` - Create course
- `PUT /api/courses/{id}` - Update course
- `DELETE /api/courses/{id}` - Delete course
- `GET /api/courses/educator/{educatorId}` - Educator courses

### Enrollments
- `GET /api/enrollments` - List enrollments
- `GET /api/enrollments/student/{studentId}` - Student enrollments
- `GET /api/enrollments/course/{courseId}` - Course enrollments
- `POST /api/enrollments` - Create enrollment
- `DELETE /api/enrollments/{id}` - Delete enrollment

### Quizzes
- `GET /api/quizzes/questions/{courseId}` - Get questions
- `GET /api/quizzes/results/user/{userId}` - Get results
- `POST /api/quizzes/results` - Submit results

### Activities
- `GET /api/activity/user/{userId}` - User activities
- `GET /api/activity/system` - System activities
- `GET /api/activity/study-hours/{userId}` - Study hours
- `POST /api/activity/log` - Log activity

### Contact
- `POST /api/contact` - Submit message

## User Roles & Permissions

### Student
- Browse and enroll in courses
- Take quizzes and view results
- Track learning progress
- Update profile information
- View personal dashboard

### Educator
- Create and manage courses
- View enrolled students
- Monitor course performance
- Update teaching profile
- Access teaching analytics

### Administrator
- Manage all users and courses
- Approve educator accounts
- View system analytics
- Configure platform settings
- Monitor system activities

## Setup & Installation

### Prerequisites
- Visual Studio 2019 or later
- SQL Server (LocalDB or full version)
- .NET Framework 4.8.1
- IIS Express (included with Visual Studio)

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone [repository-url]
   cd WAPPAssignment
   ```

2. **Database Setup**
   - Open SQL Server Management Studio
   - Create new database named `StudyValyria`
   - Execute `DatabaseSetup.sql` script

3. **Configure Connection String**
   - Open `Web.config`
   - Update connection string to match your SQL Server instance

4. **Build and Run**
   - Open solution in Visual Studio
   - Build solution (Ctrl+Shift+B)
   - Run with IIS Express (F5)

5. **Access Application**
   - Navigate to `http://localhost:[port]/Views/index.html`
   - Use demo accounts or register new users

### Demo Accounts
- **Student**: student@studyvalyria.com / password123
- **Educator**: educator@studyvalyria.com / password123
- **Admin**: admin@studyvalyria.com / password123

## Features

### Core Functionality

#### User Management
- Registration with email validation
- Role-based authentication
- Profile management
- Account approval workflow

#### Course Management
- Course creation and editing
- Enrollment system
- Progress tracking
- Course analytics

#### Assessment System
- Multiple-choice quizzes
- Automatic scoring
- Result history
- Performance analytics

#### Dashboard Features
- Role-specific interfaces
- Real-time statistics
- Activity feeds
- Responsive design

### Advanced Features

#### Analytics & Reporting
- User engagement metrics
- Course performance data
- System activity monitoring
- Study time calculation

#### Administrative Tools
- User approval system
- Platform configuration
- Content moderation
- System monitoring

## Security

### Authentication
- Password-based authentication
- Session management via localStorage
- Role-based access control
- Input validation and sanitization

### Data Protection
- SQL injection prevention
- XSS protection
- CSRF mitigation
- Secure password handling

### Best Practices
- Parameterized queries
- Error handling without information disclosure
- Proper resource disposal
- Input validation on both client and server

---

## Contributing

When contributing to StudyValyria:
1. Follow existing code patterns
2. Add proper error handling
3. Update documentation
4. Test all user roles
5. Ensure responsive design

## License

This project is developed for educational purposes as part of the Web Application Programming assignment.