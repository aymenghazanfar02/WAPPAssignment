-- Updated Database Setup with Realistic Courses and Mock Data

-- Drop existing tables if they exist (in correct order to handle foreign keys)
IF OBJECT_ID('QuizQuestions', 'U') IS NOT NULL DROP TABLE QuizQuestions;
IF OBJECT_ID('QuizResults', 'U') IS NOT NULL DROP TABLE QuizResults;
IF OBJECT_ID('Enrollments', 'U') IS NOT NULL DROP TABLE Enrollments;
IF OBJECT_ID('ActivityLogs', 'U') IS NOT NULL DROP TABLE ActivityLogs;
IF OBJECT_ID('Activities', 'U') IS NOT NULL DROP TABLE Activities;
IF OBJECT_ID('ContactMessages', 'U') IS NOT NULL DROP TABLE ContactMessages;
IF OBJECT_ID('Courses', 'U') IS NOT NULL DROP TABLE Courses;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;

-- Create Users table
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    UserType NVARCHAR(50) NOT NULL, -- student, educator, admin
    IsApproved BIT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    Bio NVARCHAR(MAX),
    RegistrationDate DATETIME DEFAULT GETDATE(),
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

-- Create QuizQuestions table
CREATE TABLE QuizQuestions (
    QuestionId INT PRIMARY KEY IDENTITY(1,1),
    CourseId INT NOT NULL,
    Question NVARCHAR(MAX) NOT NULL,
    OptionA NVARCHAR(500) NOT NULL,
    OptionB NVARCHAR(500) NOT NULL,
    OptionC NVARCHAR(500) NOT NULL,
    OptionD NVARCHAR(500) NOT NULL,
    CorrectAnswer INT NOT NULL, -- 0=A, 1=B, 2=C, 3=D
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CourseId) REFERENCES Courses(CourseId)
);

-- Create Activities table for system logs
CREATE TABLE Activities (
    ActivityId INT PRIMARY KEY IDENTITY(1,1),
    Type NVARCHAR(50),
    Message NVARCHAR(MAX),
    Date DATETIME DEFAULT GETDATE()
);

-- Create ActivityLogs table for custom activity logging
CREATE TABLE ActivityLogs (
    ActivityLogId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    Date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- Create ContactMessages table
CREATE TABLE ContactMessages (
    ContactId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    Subject NVARCHAR(200) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    SubmittedAt DATETIME DEFAULT GETDATE()
);

-- Insert sample users (educators, students, admin)
INSERT INTO Users (FirstName, LastName, Email, PasswordHash, UserType, IsApproved, IsActive, Bio, RegistrationDate) VALUES
-- Educators
('Dr. Sarah', 'Johnson', 'sarah.johnson@techuni.edu', 'hashedpassword123', 'educator', 1, 1, 'Professor of Computer Science with 15 years of experience in web development and software engineering.', DATEADD(month, -6, GETDATE())),
('Michael', 'Chen', 'michael.chen@techuni.edu', 'hashedpassword456', 'educator', 1, 1, 'Senior Data Scientist and Machine Learning expert with industry experience at top tech companies.', DATEADD(month, -4, GETDATE())),
('Dr. Emily', 'Rodriguez', 'emily.rodriguez@techuni.edu', 'hashedpassword789', 'educator', 1, 1, 'Cybersecurity specialist and ethical hacking instructor with government consulting background.', DATEADD(month, -8, GETDATE())),
-- Students
('Alex', 'Thompson', 'alex.thompson@student.edu', 'hashedpassword101', 'student', 1, 1, 'Computer Science major interested in full-stack development.', DATEADD(month, -3, GETDATE())),
('Maria', 'Garcia', 'maria.garcia@student.edu', 'hashedpassword102', 'student', 1, 1, 'Information Systems student passionate about data analytics.', DATEADD(month, -2, GETDATE())),
('James', 'Wilson', 'james.wilson@student.edu', 'hashedpassword103', 'student', 1, 1, 'Software Engineering student with interest in cybersecurity.', DATEADD(month, -5, GETDATE())),
('Lisa', 'Brown', 'lisa.brown@student.edu', 'hashedpassword104', 'student', 1, 1, 'Computer Science student focusing on web technologies.', DATEADD(month, -1, GETDATE())),
('David', 'Lee', 'david.lee@student.edu', 'hashedpassword105', 'student', 1, 1, 'IT student interested in machine learning and AI.', DATEADD(month, -4, GETDATE())),
('Sophie', 'Anderson', 'sophie.anderson@student.edu', 'hashedpassword106', 'student', 1, 1, 'Data Science student with background in statistics.', DATEADD(month, -3, GETDATE())),
-- Admin
('Admin', 'User', 'admin@techuni.edu', 'hashedpassword999', 'admin', 1, 1, 'System administrator for the learning management platform.', DATEADD(year, -1, GETDATE()));

-- Insert realistic courses with proper pricing and duration
INSERT INTO Courses (Title, Description, EducatorId, Duration, Price, Level) VALUES
('Full-Stack Web Development with React and Node.js', 'Comprehensive course covering modern web development using React for frontend and Node.js for backend. Learn to build complete web applications from scratch including database integration, authentication, and deployment.', 1, '12 weeks', 299.99, 'Intermediate'),
('Data Science and Machine Learning with Python', 'Master data analysis, visualization, and machine learning using Python. Cover pandas, numpy, scikit-learn, and TensorFlow. Includes real-world projects and datasets from various industries.', 2, '16 weeks', 399.99, 'Advanced'),
('Cybersecurity Fundamentals and Ethical Hacking', 'Learn essential cybersecurity concepts, network security, penetration testing, and ethical hacking techniques. Hands-on labs with real security tools and scenarios.', 3, '10 weeks', 349.99, 'Intermediate'),
('Mobile App Development with Flutter', 'Build cross-platform mobile applications using Flutter and Dart. Learn UI design, state management, API integration, and app store deployment for both iOS and Android.', 1, '14 weeks', 279.99, 'Beginner');

-- Insert enrollments (students enrolled in various courses)
INSERT INTO Enrollments (UserId, CourseId, EnrollmentDate, Progress) VALUES
-- Course 1 (Full-Stack Web Development) enrollments
(4, 1, DATEADD(week, -8, GETDATE()), 75),  -- Alex Thompson
(5, 1, DATEADD(week, -6, GETDATE()), 60),  -- Maria Garcia
(7, 1, DATEADD(week, -7, GETDATE()), 85),  -- Lisa Brown
(8, 1, DATEADD(week, -5, GETDATE()), 45),  -- David Lee
-- Course 2 (Data Science) enrollments
(5, 2, DATEADD(week, -10, GETDATE()), 90), -- Maria Garcia
(8, 2, DATEADD(week, -9, GETDATE()), 70),  -- David Lee
(9, 2, DATEADD(week, -8, GETDATE()), 80),  -- Sophie Anderson
-- Course 3 (Cybersecurity) enrollments
(4, 3, DATEADD(week, -4, GETDATE()), 55),  -- Alex Thompson
(6, 3, DATEADD(week, -6, GETDATE()), 65),  -- James Wilson
(7, 3, DATEADD(week, -3, GETDATE()), 40),  -- Lisa Brown
-- Course 4 (Mobile Development) enrollments
(4, 4, DATEADD(week, -2, GETDATE()), 25),  -- Alex Thompson
(5, 4, DATEADD(week, -3, GETDATE()), 35),  -- Maria Garcia
(6, 4, DATEADD(week, -4, GETDATE()), 50),  -- James Wilson
(9, 4, DATEADD(week, -1, GETDATE()), 15);  -- Sophie Anderson

-- Insert comprehensive quiz questions for all courses

-- Course 1: Full-Stack Web Development Quiz Questions
INSERT INTO QuizQuestions (CourseId, Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer) VALUES
(1, 'What is React primarily used for?', 'Backend development', 'Database management', 'Building user interfaces', 'Server configuration', 2),
(1, 'Which HTTP method is typically used to create new resources?', 'GET', 'POST', 'PUT', 'DELETE', 1),
(1, 'What does JSX stand for in React?', 'JavaScript XML', 'Java Syntax Extension', 'JSON XML', 'JavaScript Extension', 0),
(1, 'Which Node.js framework is commonly used for building APIs?', 'Angular', 'Vue.js', 'Express.js', 'React.js', 2),
(1, 'What is the purpose of middleware in Express.js?', 'Database connection', 'Request/response processing', 'Frontend rendering', 'File storage', 1);

-- Course 2: Data Science and Machine Learning Quiz Questions
INSERT INTO QuizQuestions (CourseId, Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer) VALUES
(2, 'Which Python library is primarily used for data manipulation?', 'matplotlib', 'pandas', 'seaborn', 'plotly', 1),
(2, 'What does supervised learning require?', 'Unlabeled data', 'Labeled training data', 'No data', 'Only test data', 1),
(2, 'Which algorithm is commonly used for classification problems?', 'K-means', 'Linear regression', 'Random Forest', 'PCA', 2),
(2, 'What is the purpose of cross-validation?', 'Data cleaning', 'Model evaluation', 'Feature selection', 'Data visualization', 1),
(2, 'Which metric is used to evaluate regression models?', 'Accuracy', 'Precision', 'Mean Squared Error', 'F1-score', 2);

-- Course 3: Cybersecurity Quiz Questions
INSERT INTO QuizQuestions (CourseId, Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer) VALUES
(3, 'What does CIA stand for in cybersecurity?', 'Central Intelligence Agency', 'Confidentiality, Integrity, Availability', 'Computer Information Access', 'Cyber Intelligence Analysis', 1),
(3, 'Which type of attack involves overwhelming a server with requests?', 'Phishing', 'SQL Injection', 'DDoS', 'Man-in-the-middle', 2),
(3, 'What is the primary purpose of a firewall?', 'Data encryption', 'Network traffic filtering', 'Password management', 'Virus scanning', 1),
(3, 'Which tool is commonly used for network scanning?', 'Wireshark', 'Nmap', 'Metasploit', 'Burp Suite', 1),
(3, 'What is social engineering in cybersecurity?', 'Network configuration', 'Manipulating people to reveal information', 'Software development', 'Hardware installation', 1);

-- Course 4: Mobile App Development Quiz Questions
INSERT INTO QuizQuestions (CourseId, Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer) VALUES
(4, 'What programming language does Flutter primarily use?', 'Java', 'Kotlin', 'Dart', 'Swift', 2),
(4, 'Which widget is used for layout in Flutter?', 'Text', 'Container', 'Column', 'All of the above', 3),
(4, 'What is the main advantage of Flutter?', 'Native performance only', 'Cross-platform development', 'iOS only development', 'Web only development', 1),
(4, 'Which method is called when a Flutter widget is first created?', 'dispose()', 'build()', 'initState()', 'setState()', 2),
(4, 'What is a StatefulWidget in Flutter?', 'A widget that never changes', 'A widget that can change its state', 'A widget for static content', 'A widget for navigation', 1);

-- Insert sample quiz results
INSERT INTO QuizResults (UserId, CourseId, Score, Date) VALUES
-- Course 1 quiz results
(4, 1, 85, DATEADD(week, -2, GETDATE())),
(5, 1, 78, DATEADD(week, -1, GETDATE())),
(7, 1, 92, DATEADD(week, -3, GETDATE())),
-- Course 2 quiz results
(5, 2, 88, DATEADD(week, -4, GETDATE())),
(8, 2, 76, DATEADD(week, -2, GETDATE())),
(9, 2, 94, DATEADD(week, -1, GETDATE())),
-- Course 3 quiz results
(4, 3, 72, DATEADD(week, -1, GETDATE())),
(6, 3, 89, DATEADD(week, -2, GETDATE())),
-- Course 4 quiz results
(6, 4, 81, DATEADD(week, -1, GETDATE())),
(9, 4, 67, DATEADD(day, -3, GETDATE()));

-- Insert sample activities
INSERT INTO Activities (Type, Message, Date) VALUES
('System', 'Database initialized successfully', GETDATE()),
('Course', 'New course "Full-Stack Web Development" created', DATEADD(month, -3, GETDATE())),
('Course', 'New course "Data Science and Machine Learning" created', DATEADD(month, -2, GETDATE())),
('Enrollment', 'Student enrollment surge in cybersecurity course', DATEADD(week, -1, GETDATE())),
('Quiz', 'High completion rate for mobile development quizzes', DATEADD(day, -2, GETDATE()));

PRINT 'Database setup completed successfully with realistic course data!';
PRINT 'Courses created: 4';
PRINT 'Users created: 10 (3 educators, 6 students, 1 admin)';
PRINT 'Enrollments created: 14';
PRINT 'Quiz questions created: 20 (5 per course)';
PRINT 'Quiz results created: 10';}}}