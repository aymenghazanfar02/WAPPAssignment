using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Web.Http;
using System.Configuration;

namespace WAPPAssignment.Controllers
{
    public class UsersController : ApiController
    {
        private string connectionString = ConfigurationManager.ConnectionStrings["DefaultConnection"].ConnectionString;

        [HttpGet]
        [Route("api/users")]
        public IHttpActionResult GetUsers()
        {
            List<UserModel> users = new List<UserModel>();
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "SELECT UserId, FirstName, LastName, Email, UserType, IsApproved FROM Users";
                SqlCommand cmd = new SqlCommand(query, conn);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        users.Add(new UserModel
                        {
                            UserId = Convert.ToInt32(reader["UserId"]),
                            FirstName = reader["FirstName"].ToString(),
                            LastName = reader["LastName"].ToString(),
                            Email = reader["Email"].ToString(),
                            UserType = reader["UserType"].ToString(),
                            IsApproved = Convert.ToBoolean(reader["IsApproved"])
                        });
                    }
                }
            }
            return Ok(users);
        }

        [HttpPost]
        [Route("api/users/approve/{userId}")]
        public IHttpActionResult ApproveUser(int userId)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "UPDATE Users SET IsApproved = 1 WHERE UserId = @UserId AND UserType = 'educator'";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@UserId", userId);
                int rowsAffected = cmd.ExecuteNonQuery();
                if (rowsAffected > 0)
                {
                    return Ok("User approved");
                }
                return NotFound();
            }
        }

        [HttpPost]
        [Route("api/users/register")]
        public IHttpActionResult Register([FromBody] UserRegistrationModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    string checkEmailQuery = "SELECT COUNT(*) FROM Users WHERE Email = @Email";
                    using (SqlCommand cmd = new SqlCommand(checkEmailQuery, conn))
                    {
                        cmd.Parameters.AddWithValue("@Email", model.Email);
                        int count = (int)cmd.ExecuteScalar();
                        if (count > 0)
                        {
                            return BadRequest("Email already exists.");
                        }
                    }

                    string insertQuery = @"
                        INSERT INTO Users (FirstName, LastName, Email, PasswordHash, UserType, RegistrationDate, IsActive, IsApproved)
                        VALUES (@FirstName, @LastName, @Email, @PasswordHash, @UserType, @RegistrationDate, @IsActive, @IsApproved)
                    ";
                    using (SqlCommand cmd = new SqlCommand(insertQuery, conn))
                    {
                        cmd.Parameters.AddWithValue("@FirstName", model.FirstName);
                        cmd.Parameters.AddWithValue("@LastName", model.LastName);
                        cmd.Parameters.AddWithValue("@Email", model.Email);
                        cmd.Parameters.AddWithValue("@PasswordHash", HashPassword(model.Password));
                        cmd.Parameters.AddWithValue("@UserType", model.UserType);
                        cmd.Parameters.AddWithValue("@RegistrationDate", DateTime.Now);
                        cmd.Parameters.AddWithValue("@IsActive", model.UserType == "student");
                        cmd.Parameters.AddWithValue("@IsApproved", model.UserType == "student");

                        cmd.ExecuteNonQuery();
                    }
                }
                return Ok("User registered successfully.");
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpGet]
        [Route("api/users/{id}")]
        public IHttpActionResult GetUser(int id)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "SELECT UserId, FirstName, LastName, Email, UserType, IsApproved, Bio FROM Users WHERE UserId = @Id";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return Ok(new UserModel
                        {
                            UserId = Convert.ToInt32(reader["UserId"]),
                            FirstName = reader["FirstName"].ToString(),
                            LastName = reader["LastName"].ToString(),
                            Email = reader["Email"].ToString(),
                            UserType = reader["UserType"].ToString(),
                            IsApproved = Convert.ToBoolean(reader["IsApproved"]),
                            Bio = reader["Bio"].ToString()
                        });
                    }
                    return NotFound();
                }
            }
        }

        [HttpPut]
        [Route("api/users/{id}")]
        public IHttpActionResult UpdateUser(int id, [FromBody] UserUpdateModel model)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "UPDATE Users SET FirstName = @FirstName, LastName = @LastName, Bio = @Bio WHERE UserId = @Id";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                cmd.Parameters.AddWithValue("@FirstName", model.FirstName);
                cmd.Parameters.AddWithValue("@LastName", model.LastName);
                cmd.Parameters.AddWithValue("@Bio", model.Bio ?? "");
                int rowsAffected = cmd.ExecuteNonQuery();
                if (rowsAffected > 0)
                {
                    return Ok("Profile updated successfully");
                }
                return NotFound();
            }
        }

        private string HashPassword(string password)
        {
            return Convert.ToBase64String(System.Security.Cryptography.SHA256.Create().ComputeHash(System.Text.Encoding.UTF8.GetBytes(password)));
        }
    }

    public class UserModel
    {
        public int UserId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string UserType { get; set; }
        public bool IsApproved { get; set; }
        public string Bio { get; set; }
    }

    public class UserRegistrationModel
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string UserType { get; set; }
    }

    public class UserUpdateModel
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Bio { get; set; }
    }
}