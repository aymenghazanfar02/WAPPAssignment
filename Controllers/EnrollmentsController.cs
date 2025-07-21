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

        [HttpPost]
        [Route("api/enrollments")]
        public IHttpActionResult Enroll([FromBody] EnrollmentModel enrollment)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "INSERT INTO Enrollments (UserId, CourseId) VALUES (@UserId, @CourseId)";
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
        [Route("api/enrollments/{enrollmentId}")]
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
}