using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Web.Http;
using System.Configuration;

namespace WAPPAssignment.Controllers
{
    public class ActivityController : ApiController
    {
        private string connectionString = ConfigurationManager.ConnectionStrings["DefaultConnection"].ConnectionString;

        [HttpGet]
        [Route("api/activity/user/{userId}")]
        public IHttpActionResult GetUserActivity(int userId)
        {
            List<ActivityModel> activities = new List<ActivityModel>();
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                
                // Get enrollment activities
                string enrollmentQuery = @"
                    SELECT 'enrollment' as ActivityType, 
                           'Enrolled in ' + c.Title as Message,
                           e.EnrollmentDate as Date
                    FROM Enrollments e
                    INNER JOIN Courses c ON e.CourseId = c.CourseId
                    WHERE e.UserId = @UserId
                ";
                
                SqlCommand cmd = new SqlCommand(enrollmentQuery, conn);
                cmd.Parameters.AddWithValue("@UserId", userId);
                
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        activities.Add(new ActivityModel
                        {
                            Type = reader["ActivityType"].ToString(),
                            Message = reader["Message"].ToString(),
                            Date = Convert.ToDateTime(reader["Date"])
                        });
                    }
                }
            }
            
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                
                // Get quiz activities
                string quizQuery = @"
                    SELECT 'quiz' as ActivityType,
                           'Completed ' + c.Title + ' Quiz - Score: ' + CAST(qr.Score as VARCHAR) + '%' as Message,
                           qr.Date as Date
                    FROM QuizResults qr
                    INNER JOIN Courses c ON qr.CourseId = c.CourseId
                    WHERE qr.UserId = @UserId
                ";
                
                SqlCommand cmd = new SqlCommand(quizQuery, conn);
                cmd.Parameters.AddWithValue("@UserId", userId);
                
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        activities.Add(new ActivityModel
                        {
                            Type = reader["ActivityType"].ToString(),
                            Message = reader["Message"].ToString(),
                            Date = Convert.ToDateTime(reader["Date"])
                        });
                    }
                }
            }
            
            // Sort by date descending and take top 10
            activities.Sort((a, b) => b.Date.CompareTo(a.Date));
            if (activities.Count > 10)
            {
                activities = activities.GetRange(0, 10);
            }
            
            return Ok(activities);
        }

        [HttpGet]
        [Route("api/activity/study-hours/{userId}")]
        public IHttpActionResult GetStudyHours(int userId)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                
                // Calculate study hours based on enrollments and progress
                string query = @"
                    SELECT 
                        COUNT(e.EnrollmentId) as TotalEnrollments,
                        AVG(CAST(e.Progress as FLOAT)) as AverageProgress
                    FROM Enrollments e
                    WHERE e.UserId = @UserId
                ";
                
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@UserId", userId);
                
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        int totalEnrollments = Convert.ToInt32(reader["TotalEnrollments"]);
                        double averageProgress = reader["AverageProgress"] == DBNull.Value ? 0 : Convert.ToDouble(reader["AverageProgress"]);
                        
                        // Estimate study hours: 20 hours per course * progress percentage
                        int estimatedStudyHours = (int)(totalEnrollments * 20 * (averageProgress / 100));
                        
                        return Ok(new { StudyHours = estimatedStudyHours });
                    }
                }
            }
            
            return Ok(new { StudyHours = 0 });
        }

        [HttpGet]
        [Route("api/activity/system")]
        public IHttpActionResult GetSystemActivity()
        {
            List<ActivityModel> activities = new List<ActivityModel>();
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                
                // Get recent user registrations
                string userQuery = @"
                    SELECT TOP 5 'user' as ActivityType,
                           'New ' + UserType + ' account created: ' + Email as Message,
                           RegistrationDate as Date
                    FROM Users
                    WHERE RegistrationDate >= DATEADD(day, -7, GETDATE())
                    ORDER BY RegistrationDate DESC
                ";
                
                SqlCommand cmd = new SqlCommand(userQuery, conn);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        activities.Add(new ActivityModel
                        {
                            Type = reader["ActivityType"].ToString(),
                            Message = reader["Message"].ToString(),
                            Date = Convert.ToDateTime(reader["Date"])
                        });
                    }
                }
            }
            
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                
                // Get recent course creations
                string courseQuery = @"
                    SELECT TOP 5 'course' as ActivityType,
                           'Course "' + Title + '" was published' as Message,
                           CreatedAt as Date
                    FROM Courses
                    WHERE CreatedAt >= DATEADD(day, -7, GETDATE())
                    ORDER BY CreatedAt DESC
                ";
                
                SqlCommand cmd = new SqlCommand(courseQuery, conn);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        activities.Add(new ActivityModel
                        {
                            Type = reader["ActivityType"].ToString(),
                            Message = reader["Message"].ToString(),
                            Date = Convert.ToDateTime(reader["Date"])
                        });
                    }
                }
            }
            
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                
                // Get recent enrollments count
                string enrollmentQuery = @"
                    SELECT 'enrollment' as ActivityType,
                           CAST(COUNT(*) as VARCHAR) + ' new enrollments today' as Message,
                           CAST(GETDATE() as DATE) as Date
                    FROM Enrollments
                    WHERE CAST(EnrollmentDate as DATE) = CAST(GETDATE() as DATE)
                    HAVING COUNT(*) > 0
                ";
                
                SqlCommand cmd = new SqlCommand(enrollmentQuery, conn);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        activities.Add(new ActivityModel
                        {
                            Type = reader["ActivityType"].ToString(),
                            Message = reader["Message"].ToString(),
                            Date = Convert.ToDateTime(reader["Date"])
                        });
                    }
                }
            }
            
            // Sort by date descending and take top 10
            activities.Sort((a, b) => b.Date.CompareTo(a.Date));
            if (activities.Count > 10)
            {
                activities = activities.GetRange(0, 10);
            }
            
            return Ok(activities);
        }

        [HttpPost]
        [Route("api/activity/log")]
        public IHttpActionResult LogActivity([FromBody] ActivityLogModel activityLog)
        {
            if (activityLog == null || activityLog.UserId <= 0 || string.IsNullOrEmpty(activityLog.Type) || string.IsNullOrEmpty(activityLog.Message))
            {
                return BadRequest("Invalid activity log data. UserId, Type, and Message are required.");
            }

            try
            {
                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    
                    // Insert custom activity log
                    string query = @"
                        INSERT INTO ActivityLogs (UserId, Type, Message, Date)
                        VALUES (@UserId, @Type, @Message, @Date)
                    ";
                    
                    SqlCommand cmd = new SqlCommand(query, conn);
                    cmd.Parameters.AddWithValue("@UserId", activityLog.UserId);
                    cmd.Parameters.AddWithValue("@Type", activityLog.Type);
                    cmd.Parameters.AddWithValue("@Message", activityLog.Message);
                    cmd.Parameters.AddWithValue("@Date", activityLog.Date == DateTime.MinValue ? DateTime.Now : activityLog.Date);
                    
                    int rowsAffected = cmd.ExecuteNonQuery();
                    
                    if (rowsAffected > 0)
                    {
                        return Ok(new { Message = "Activity logged successfully", Success = true });
                    }
                    else
                    {
                        return InternalServerError(new Exception("Failed to log activity"));
                    }
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }

    public class ActivityModel
    {
        public string Type { get; set; }
        public string Message { get; set; }
        public DateTime Date { get; set; }
    }

    public class ActivityLogModel
    {
        public int UserId { get; set; }
        public string Type { get; set; }
        public string Message { get; set; }
        public DateTime Date { get; set; }
    }
}