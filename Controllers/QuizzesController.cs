using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Web.Http;
using System.Configuration;

namespace WAPPAssignment.Controllers
{
    public class QuizzesController : ApiController
    {
        private string connectionString = ConfigurationManager.ConnectionStrings["DefaultConnection"].ConnectionString;

        [HttpPost]
        [Route("api/quizzes/results")]
        public IHttpActionResult SaveQuizResult([FromBody] QuizResultModel result)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "INSERT INTO QuizResults (UserId, CourseId, Score) VALUES (@UserId, @CourseId, @Score)";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@UserId", result.UserId);
                cmd.Parameters.AddWithValue("@CourseId", result.CourseId);
                cmd.Parameters.AddWithValue("@Score", result.Score);

                try
                {
                    cmd.ExecuteNonQuery();
                    return Ok("Quiz result saved successfully");
                }
                catch (Exception ex)
                {
                    return InternalServerError(ex);
                }
            }
        }

        [HttpGet]
        [Route("api/quizzes/results/user/{userId}")]
        public IHttpActionResult GetQuizResultsByUser(int userId)
        {
            List<QuizResultModel> results = new List<QuizResultModel>();
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "SELECT QuizResultId, CourseId, Score, Date FROM QuizResults WHERE UserId = @UserId";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@UserId", userId);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        results.Add(new QuizResultModel
                        {
                            QuizResultId = Convert.ToInt32(reader["QuizResultId"]),
                            CourseId = Convert.ToInt32(reader["CourseId"]),
                            Score = Convert.ToInt32(reader["Score"]),
                            Date = Convert.ToDateTime(reader["Date"])
                        });
                    }
                }
            }
            return Ok(results);
        }
    }

    public class QuizResultModel
    {
        public int QuizResultId { get; set; }
        public int UserId { get; set; }
        public int CourseId { get; set; }
        public int Score { get; set; }
        public DateTime Date { get; set; }
    }
}