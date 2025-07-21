using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Web.Http;
using System.Configuration;

namespace WAPPAssignment.Controllers
{
    public class CoursesController : ApiController
    {
        private string connectionString = ConfigurationManager.ConnectionStrings["DefaultConnection"].ConnectionString;

        [HttpGet]
        [Route("api/courses")]
        public IHttpActionResult GetCourses()
        {
            List<CourseModel> courses = new List<CourseModel>();
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "SELECT CourseId, Title, Description, EducatorId, Duration, Price, Level FROM Courses";
                SqlCommand cmd = new SqlCommand(query, conn);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        courses.Add(new CourseModel
                        {
                            CourseId = Convert.ToInt32(reader["CourseId"]),
                            Title = reader["Title"].ToString(),
                            Description = reader["Description"].ToString(),
                            EducatorId = Convert.ToInt32(reader["EducatorId"]),
                            Duration = reader["Duration"].ToString(),
                            Price = Convert.ToDecimal(reader["Price"]),
                            Level = reader["Level"].ToString()
                        });
                    }
                }
            }
            return Ok(courses);
        }

        [HttpGet]
        [Route("api/courses/{id}")]
        public IHttpActionResult GetCourse(int id)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "SELECT CourseId, Title, Description, EducatorId, Duration, Price, Level FROM Courses WHERE CourseId = @Id";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return Ok(new CourseModel
                        {
                            CourseId = Convert.ToInt32(reader["CourseId"]),
                            Title = reader["Title"].ToString(),
                            Description = reader["Description"].ToString(),
                            EducatorId = Convert.ToInt32(reader["EducatorId"]),
                            Duration = reader["Duration"].ToString(),
                            Price = Convert.ToDecimal(reader["Price"]),
                            Level = reader["Level"].ToString()
                        });
                    }
                    else
                    {
                        return NotFound();
                    }
                }
            }
        }

        [HttpPost]
        [Route("api/courses")]
        public IHttpActionResult CreateCourse([FromBody] CourseModel course)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "INSERT INTO Courses (Title, Description, EducatorId, Duration, Price, Level) VALUES (@Title, @Description, @EducatorId, @Duration, @Price, @Level)";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Title", course.Title);
                cmd.Parameters.AddWithValue("@Description", course.Description);
                cmd.Parameters.AddWithValue("@EducatorId", course.EducatorId);
                cmd.Parameters.AddWithValue("@Duration", course.Duration ?? "");
                cmd.Parameters.AddWithValue("@Price", course.Price);
                cmd.Parameters.AddWithValue("@Level", course.Level ?? "");

                try
                {
                    cmd.ExecuteNonQuery();
                    return Ok("Course created successfully");
                }
                catch (Exception ex)
                {
                    return InternalServerError(ex);
                }
            }
        }

        [HttpGet]
        [Route("api/courses/educator/{educatorId}")]
        public IHttpActionResult GetCoursesByEducator(int educatorId)
        {
            List<CourseModel> courses = new List<CourseModel>();
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "SELECT CourseId, Title, Description, EducatorId, Duration, Price, Level FROM Courses WHERE EducatorId = @EducatorId";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@EducatorId", educatorId);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        courses.Add(new CourseModel
                        {
                            CourseId = Convert.ToInt32(reader["CourseId"]),
                            Title = reader["Title"].ToString(),
                            Description = reader["Description"].ToString(),
                            EducatorId = Convert.ToInt32(reader["EducatorId"]),
                            Duration = reader["Duration"].ToString(),
                            Price = Convert.ToDecimal(reader["Price"]),
                            Level = reader["Level"].ToString()
                        });
                    }
                }
            }
            return Ok(courses);
        }

        [HttpPut]
        [Route("api/courses/{id}")]
        public IHttpActionResult UpdateCourse(int id, [FromBody] CourseModel course)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                // Check if course exists and belongs to the educator
                string checkQuery = "SELECT EducatorId FROM Courses WHERE CourseId = @Id";
                SqlCommand checkCmd = new SqlCommand(checkQuery, conn);
                checkCmd.Parameters.AddWithValue("@Id", id);
                object result = checkCmd.ExecuteScalar();
                if (result == null || Convert.ToInt32(result) != course.EducatorId)
                {
                    return BadRequest("Course not found or you don't have permission to update it.");
                }

                string query = "UPDATE Courses SET Title = @Title, Description = @Description, Duration = @Duration, Price = @Price, Level = @Level WHERE CourseId = @Id";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                cmd.Parameters.AddWithValue("@Title", course.Title);
                cmd.Parameters.AddWithValue("@Description", course.Description);
                cmd.Parameters.AddWithValue("@Duration", course.Duration ?? "");
                cmd.Parameters.AddWithValue("@Price", course.Price);
                cmd.Parameters.AddWithValue("@Level", course.Level ?? "");

                try
                {
                    cmd.ExecuteNonQuery();
                    return Ok("Course updated successfully");
                }
                catch (Exception ex)
                {
                    return InternalServerError(ex);
                }
            }
        }

        [HttpDelete]
        [Route("api/courses/{id}")]
        public IHttpActionResult DeleteCourse(int id, [FromUri] int educatorId)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                // Check if course exists and belongs to the educator
                string checkQuery = "SELECT EducatorId FROM Courses WHERE CourseId = @Id";
                SqlCommand checkCmd = new SqlCommand(checkQuery, conn);
                checkCmd.Parameters.AddWithValue("@Id", id);
                object result = checkCmd.ExecuteScalar();
                if (result == null || Convert.ToInt32(result) != educatorId)
                {
                    return BadRequest("Course not found or you don't have permission to delete it.");
                }

                string query = "DELETE FROM Courses WHERE CourseId = @Id";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);

                try
                {
                    cmd.ExecuteNonQuery();
                    return Ok("Course deleted successfully");
                }
                catch (Exception ex)
                {
                    return InternalServerError(ex);
                }
            }
        }
    }

    public class CourseModel
    {
        public int CourseId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public int EducatorId { get; set; }
        public string Duration { get; set; }
        public decimal Price { get; set; }
        public string Level { get; set; }
    }
}