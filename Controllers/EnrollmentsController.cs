using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Web.Http;
using System.Configuration;

namespace WAPPAssignment.Controllers
{
    public class EnrollmentsController : ApiController
    {
        private string connectionString = ConfigurationManager.ConnectionStrings["DefaultConnection"].ConnectionString;

        [HttpGet]
        [Route("api/enrollments")]
        public IHttpActionResult GetAllEnrollments()
        {
            List<EnrollmentWithCourseModel> enrollments = new List<EnrollmentWithCourseModel>();
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = @"SELECT e.EnrollmentId, e.UserId, e.CourseId, e.EnrollmentDate, e.Progress,
                                        c.Title, c.Price
                                 FROM Enrollments e
                                 INNER JOIN Courses c ON e.CourseId = c.CourseId";
                SqlCommand cmd = new SqlCommand(query, conn);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        enrollments.Add(new EnrollmentWithCourseModel
                        {
                            EnrollmentId = Convert.ToInt32(reader["EnrollmentId"]),
                            UserId = Convert.ToInt32(reader["UserId"]),
                            CourseId = Convert.ToInt32(reader["CourseId"]),
                            EnrollmentDate = Convert.ToDateTime(reader["EnrollmentDate"]),
                            Progress = Convert.ToInt32(reader["Progress"]),
                            CourseTitle = reader["Title"].ToString(),
                            CoursePrice = Convert.ToDecimal(reader["Price"])
                        });
                    }
                }
            }
            return Ok(enrollments);
        }

        [HttpPost]
        [Route("api/enrollments")]
        public IHttpActionResult Enroll([FromBody] EnrollmentModel enrollment)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "INSERT INTO Enrollments (UserId, CourseId, Progress) VALUES (@UserId, @CourseId, 0)";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@UserId", enrollment.UserId);
                cmd.Parameters.AddWithValue("@CourseId", enrollment.CourseId);

                try
                {
                    cmd.ExecuteNonQuery();
                    return Ok("Enrolled successfully");
                }
                catch (Exception ex)
                {
                    return InternalServerError(ex);
                }
            }
        }

        [HttpGet]
        [Route("api/enrollments/user/{userId}")]
        public IHttpActionResult GetEnrollmentsByUser(int userId)
        {
            List<EnrollmentModel> enrollments = new List<EnrollmentModel>();
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "SELECT EnrollmentId, CourseId, Progress FROM Enrollments WHERE UserId = @UserId";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@UserId", userId);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        enrollments.Add(new EnrollmentModel
                        {
                            EnrollmentId = Convert.ToInt32(reader["EnrollmentId"]),
                            CourseId = Convert.ToInt32(reader["CourseId"]),
                            Progress = Convert.ToInt32(reader["Progress"])
                        });
                    }
                }
            }
            return Ok(enrollments);
        }

        [HttpGet]
        [Route("api/enrollments/course/{courseId}")]
        public IHttpActionResult GetEnrollmentsByCourse(int courseId)
        {
            List<EnrollmentWithUserModel> enrollments = new List<EnrollmentWithUserModel>();
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = @"SELECT e.EnrollmentId, e.UserId, e.EnrollmentDate, u.FirstName, u.LastName, u.Email
                                 FROM Enrollments e
                                 INNER JOIN Users u ON e.UserId = u.UserId
                                 WHERE e.CourseId = @CourseId";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CourseId", courseId);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        enrollments.Add(new EnrollmentWithUserModel
                        {
                            EnrollmentId = Convert.ToInt32(reader["EnrollmentId"]),
                            UserId = Convert.ToInt32(reader["UserId"]),
                            FirstName = reader["FirstName"].ToString(),
                            LastName = reader["LastName"].ToString(),
                            Email = reader["Email"].ToString(),
                            EnrollmentDate = Convert.ToDateTime(reader["EnrollmentDate"])
                        });
                    }
                }
            }
            return Ok(enrollments);
        }

        [HttpDelete]
        [Route("api/enrollments/{userId}/{courseId}")]
        public IHttpActionResult UnenrollByUserAndCourse(int userId, int courseId)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "DELETE FROM Enrollments WHERE UserId = @UserId AND CourseId = @CourseId";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.Parameters.AddWithValue("@CourseId", courseId);

                int rowsAffected = cmd.ExecuteNonQuery();
                if (rowsAffected > 0)
                {
                    return Ok("Unenrolled successfully");
                }
                else
                {
                    return NotFound();
                }
            }
        }

        [HttpDelete]
        [Route("api/enrollments/by-id/{enrollmentId}")]
        public IHttpActionResult Unenroll(int enrollmentId)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "DELETE FROM Enrollments WHERE EnrollmentId = @EnrollmentId";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@EnrollmentId", enrollmentId);

                int rowsAffected = cmd.ExecuteNonQuery();
                if (rowsAffected > 0)
                {
                    return Ok("Unenrolled successfully");
                }
                else
                {
                    return NotFound();
                }
            }
        }

        [HttpPut]
        [Route("api/enrollments/progress")]
        public IHttpActionResult UpdateProgress([FromBody] ProgressUpdateModel progressUpdate)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "UPDATE Enrollments SET Progress = @Progress WHERE UserId = @UserId AND CourseId = @CourseId";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Progress", progressUpdate.Progress);
                cmd.Parameters.AddWithValue("@UserId", progressUpdate.UserId);
                cmd.Parameters.AddWithValue("@CourseId", progressUpdate.CourseId);

                int rowsAffected = cmd.ExecuteNonQuery();
                if (rowsAffected > 0)
                {
                    return Ok("Progress updated successfully");
                }
                else
                {
                    return NotFound();
                }
            }
        }
    }

    public class EnrollmentModel
    {
        public int EnrollmentId { get; set; }
        public int UserId { get; set; }
        public int CourseId { get; set; }
        public int Progress { get; set; }
    }

    public class EnrollmentWithUserModel
    {
        public int EnrollmentId { get; set; }
        public int UserId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public DateTime EnrollmentDate { get; set; }
    }

    public class EnrollmentWithCourseModel
    {
        public int EnrollmentId { get; set; }
        public int UserId { get; set; }
        public int CourseId { get; set; }
        public DateTime EnrollmentDate { get; set; }
        public int Progress { get; set; }
        public string CourseTitle { get; set; }
        public decimal CoursePrice { get; set; }
    }

    public class ProgressUpdateModel
    {
        public int UserId { get; set; }
        public int CourseId { get; set; }
        public int Progress { get; set; }
    }
}