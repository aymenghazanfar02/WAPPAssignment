# Backend Documentation

## Architecture Overview

The StudyValyria backend is built using **ASP.NET Web API** with the following architecture:

- **Framework**: .NET Framework 4.8
- **API Type**: RESTful Web API
- **Database**: SQL Server with Entity Framework-like data access
- **Authentication**: Custom session-based authentication
- **Routing**: Attribute-based and convention-based routing

## Project Structure

```
WAPPAssignment/
├── Controllers/           # Web API Controllers
│   ├── AuthController.cs
│   ├── UsersController.cs
│   ├── CoursesController.cs
│   ├── EnrollmentsController.cs
│   ├── QuizResultsController.cs
│   ├── ActivityController.cs
│   └── ContactController.cs
├── App_Start/            # Application configuration
│   └── WebApiConfig.cs
├── Global.asax.cs        # Application lifecycle
├── Web.config           # Configuration file
└── DatabaseSetup.sql    # Database schema
```

## Controllers Overview

### 1. AuthController
**Purpose**: Handles user authentication

```csharp
// Endpoints
POST /api/auth/login
```

**Features**:
- Email/password validation
- User role verification
- Session management
- Returns user profile data

### 2. UsersController
**Purpose**: User management operations

```csharp
// Endpoints
GET    /api/users              # List all users (admin only)
GET    /api/users/{id}         # Get specific user
POST   /api/users              # Create new user
PUT    /api/users/{id}         # Update user profile
DELETE /api/users/{id}         # Delete user
GET    /api/users/check-email  # Check email availability
PUT    /api/users/{id}/approve # Approve educator accounts
PUT    /api/users/{id}/status  # Update user status
```

**Features**:
- Role-based access control
- Email validation
- Password hashing
- User approval workflow

### 3. CoursesController
**Purpose**: Course management

```csharp
// Endpoints
GET    /api/courses                    # List all courses
GET    /api/courses/{id}              # Get course details
POST   /api/courses                   # Create new course
PUT    /api/courses/{id}              # Update course
DELETE /api/courses/{id}              # Delete course
GET    /api/courses/educator/{id}     # Get educator's courses
```

**Features**:
- Course CRUD operations
- Educator-specific course management
- Course enrollment tracking
- Course analytics

### 4. EnrollmentsController
**Purpose**: Student enrollment management

```csharp
// Endpoints
GET    /api/enrollments                    # List enrollments
GET    /api/enrollments/student/{id}      # Student's enrollments
GET    /api/enrollments/course/{id}       # Course enrollments
POST   /api/enrollments                   # Create enrollment
DELETE /api/enrollments/{id}             # Delete enrollment
```

### 5. QuizResultsController
**Purpose**: Quiz and assessment management

```csharp
// Endpoints
GET    /api/quizzes/questions/{courseId}  # Get quiz questions
GET    /api/quizzes/results/user/{userId} # Get user results
POST   /api/quizzes/results               # Submit quiz results
```

### 6. ActivityController
**Purpose**: Activity logging and analytics

```csharp
// Endpoints
GET    /api/activity/user/{userId}        # User activities
GET    /api/activity/system               # System activities
GET    /api/activity/study-hours/{userId} # Study time tracking
POST   /api/activity/log                  # Log new activity
```

### 7. ContactController
**Purpose**: Contact form submissions

```csharp
// Endpoints
POST   /api/contact                       # Submit contact message
```

## Data Models

### User Model
```csharp
public class User
{
    public int UserId { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    public string Role { get; set; }  // Student, Educator, Admin
    public string Status { get; set; } // Active, Pending, Inactive
    public DateTime CreatedAt { get; set; }
}
```

### Course Model
```csharp
public class Course
{
    public int CourseId { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public int EducatorId { get; set; }
    public string Category { get; set; }
    public string Level { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### Enrollment Model
```csharp
public class Enrollment
{
    public int EnrollmentId { get; set; }
    public int StudentId { get; set; }
    public int CourseId { get; set; }
    public DateTime EnrolledAt { get; set; }
    public string Status { get; set; }
}
```

## Database Schema

### Core Tables
- **Users**: User accounts and profiles
- **Courses**: Course information
- **Enrollments**: Student-course relationships
- **QuizQuestions**: Assessment questions
- **QuizResults**: Student quiz submissions
- **Activities**: System activity logs
- **ActivityLogs**: User-specific activities
- **ContactMessages**: Contact form submissions

### Relationships
- Users (1) → Courses (Many) - Educator relationship
- Users (Many) ← → Courses (Many) - Student enrollments
- Courses (1) → QuizQuestions (Many)
- Users (1) → QuizResults (Many)
- Users (1) → ActivityLogs (Many)

## Authentication & Authorization

### Authentication Flow
1. User submits credentials to `/api/auth/login`
2. Server validates against database
3. Returns user profile with role information
4. Client stores user data in localStorage
5. Subsequent requests include user context

### Role-Based Access
- **Student**: Course browsing, enrollment, quiz taking
- **Educator**: Course management, student monitoring
- **Admin**: Full system access, user management

## Error Handling

### Standard HTTP Status Codes
- `200 OK`: Successful operation
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Error Response Format
```json
{
  "error": "Error message",
  "details": "Additional error details",
  "timestamp": "2025-01-27T10:30:00Z"
}
```

## Configuration

### Web.config Settings
```xml
<configuration>
  <connectionStrings>
    <add name="DefaultConnection" 
         connectionString="Server=(localdb)\mssqllocaldb;Database=StudyValyria;Trusted_Connection=True;" />
  </connectionStrings>
  
  <system.web>
    <compilation debug="true" targetFramework="4.8" />
    <httpRuntime targetFramework="4.8" />
  </system.web>
</configuration>
```

### API Configuration (WebApiConfig.cs)
```csharp
public static class WebApiConfig
{
    public static void Register(HttpConfiguration config)
    {
        config.MapHttpAttributeRoutes();
        config.Routes.MapHttpRoute(
            name: "DefaultApi",
            routeTemplate: "api/{controller}/{id}",
            defaults: new { id = RouteParameter.Optional }
        );
    }
}
```

## Development Guidelines

### Adding New Controllers
1. Inherit from `ApiController`
2. Use appropriate HTTP verbs (`[HttpGet]`, `[HttpPost]`, etc.)
3. Implement proper error handling
4. Add input validation
5. Follow RESTful conventions

### Database Operations
1. Use parameterized queries to prevent SQL injection
2. Implement proper connection disposal
3. Handle database exceptions gracefully
4. Use transactions for multi-table operations

### Security Best Practices
1. Validate all input parameters
2. Use parameterized SQL queries
3. Implement proper authentication checks
4. Sanitize output data
5. Log security-related events

## Testing

### API Testing Tools
- **Postman**: For manual API testing
- **Swagger**: API documentation and testing
- **Unit Tests**: Controller and service testing

### Sample API Calls
```bash
# Login
curl -X POST http://localhost:51264/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@studyvalyria.com","password":"password123"}'

# Get courses
curl -X GET http://localhost:51264/api/courses

# Create user
curl -X POST http://localhost:51264/api/users \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"password123","role":"Student"}'
```

## Performance Considerations

- **Database Indexing**: Ensure proper indexes on frequently queried columns
- **Connection Pooling**: Use connection pooling for database operations
- **Caching**: Implement caching for frequently accessed data
- **Pagination**: Implement pagination for large data sets
- **Async Operations**: Use async/await for I/O operations

## Monitoring & Logging

- **Application Logs**: Log important events and errors
- **Performance Metrics**: Monitor response times and throughput
- **Error Tracking**: Implement error tracking and alerting
- **Database Monitoring**: Monitor database performance and queries