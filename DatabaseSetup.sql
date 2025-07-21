-- Create Users table
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    UserType NVARCHAR(50) NOT NULL, -- student, educator, admin
    IsApproved BIT DEFAULT 0,
    Bio NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Create Courses table
CREATE TABLE Courses (
    CourseId INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    EducatorId INT NOT NULL,
    Duration NVARCHAR(50),
    Price DECIMAL(10,2),
    Level NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (EducatorId) REFERENCES Users(UserId)
);

-- Create Enrollments table
CREATE TABLE Enrollments (
    EnrollmentId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    CourseId INT NOT NULL,
    EnrollmentDate DATETIME DEFAULT GETDATE(),
    Progress INT DEFAULT 0,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (CourseId) REFERENCES Courses(CourseId)
);

-- Create QuizResults table
CREATE TABLE QuizResults (
    QuizResultId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    CourseId INT NOT NULL,
    Score INT NOT NULL,
    Date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (CourseId) REFERENCES Courses(CourseId)
);

-- Create Activities table for system logs
CREATE TABLE Activities (
    ActivityId INT PRIMARY KEY IDENTITY(1,1),
    Type NVARCHAR(50),
    Message NVARCHAR(MAX),
    Date DATETIME DEFAULT GETDATE()
);)}}}