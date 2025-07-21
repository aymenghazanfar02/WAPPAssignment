using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Web.Http;
using System.Configuration;

namespace WAPPAssignment.Controllers
{
    public class QuizResultsController : ApiController
    {
        private string connectionString = ConfigurationManager.ConnectionStrings["DefaultConnection"].ConnectionString;

        [HttpPost]
        [Route("api/quizzes/results")]
        public IHttpActionResult SaveQuizResult([FromBody] QuizResultModel result)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "INSERT INTO QuizResults (UserId, CourseId, Score, Date) VALUES (@UserId, @CourseId, @Score, @Date)";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@UserId", result.UserId);
                cmd.Parameters.AddWithValue("@CourseId", result.CourseId);
                cmd.Parameters.AddWithValue("@Score", result.Score);
                cmd.Parameters.AddWithValue("@Date", DateTime.Now);

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
                string query = "SELECT QuizResultId, UserId, CourseId, Score, Date FROM QuizResults WHERE UserId = @UserId ORDER BY Date DESC";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@UserId", userId);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        results.Add(new QuizResultModel
                        {
                            QuizResultId = Convert.ToInt32(reader["QuizResultId"]),
                            UserId = Convert.ToInt32(reader["UserId"]),
                            CourseId = Convert.ToInt32(reader["CourseId"]),
                            Score = Convert.ToInt32(reader["Score"]),
                            Date = Convert.ToDateTime(reader["Date"])
                        });
                    }
                }
            }
            return Ok(results);
        }

        [HttpGet]
        [Route("api/quizzes/results/course/{courseId}")]
        public IHttpActionResult GetQuizResultsByCourse(int courseId)
        {
            List<QuizResultModel> results = new List<QuizResultModel>();
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "SELECT QuizResultId, UserId, CourseId, Score, Date FROM QuizResults WHERE CourseId = @CourseId ORDER BY Date DESC";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CourseId", courseId);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        results.Add(new QuizResultModel
                        {
                            QuizResultId = Convert.ToInt32(reader["QuizResultId"]),
                            UserId = Convert.ToInt32(reader["UserId"]),
                            CourseId = Convert.ToInt32(reader["CourseId"]),
                            Score = Convert.ToInt32(reader["Score"]),
                            Date = Convert.ToDateTime(reader["Date"])
                        });
                    }
                }
            }
            return Ok(results);
        }

        [HttpGet]
        [Route("api/quizzes/questions/{courseId}")]
        public IHttpActionResult GetQuizQuestions(int courseId)
        {
            List<QuizQuestionModel> questions = new List<QuizQuestionModel>();
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "SELECT QuestionId, Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer FROM QuizQuestions WHERE CourseId = @CourseId ORDER BY QuestionId";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CourseId", courseId);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        questions.Add(new QuizQuestionModel
                        {
                            QuestionId = Convert.ToInt32(reader["QuestionId"]),
                            Question = reader["Question"].ToString(),
                            Options = new string[] {
                                reader["OptionA"].ToString(),
                                reader["OptionB"].ToString(),
                                reader["OptionC"].ToString(),
                                reader["OptionD"].ToString()
                            },
                            CorrectAnswer = Convert.ToInt32(reader["CorrectAnswer"])
                        });
                    }
                }
            }
            return Ok(questions);
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

    public class QuizQuestionModel
    {
        public int QuestionId { get; set; }
        public string Question { get; set; }
        public string[] Options { get; set; }
        public int CorrectAnswer { get; set; }
    }
}