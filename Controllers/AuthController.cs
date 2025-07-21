using System;
using System.Data.SqlClient;
using System.Web.Http;
using System.Configuration;
using System.Security.Cryptography;
using System.Text;

namespace WAPPAssignment.Controllers
{
    public class AuthController : ApiController
    {
        private string connectionString = ConfigurationManager.ConnectionStrings["DefaultConnection"].ConnectionString;

        [HttpPost]
        [Route("api/auth/register")]
        public IHttpActionResult Register([FromBody] UserModel user)
        {
            if (string.IsNullOrEmpty(user.Email) || string.IsNullOrEmpty(user.Password) || string.IsNullOrEmpty(user.UserType))
            {
                return BadRequest("Invalid input");
            }

            string hashedPassword = HashPassword(user.Password);

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "INSERT INTO Users (FirstName, LastName, Email, PasswordHash, UserType, IsApproved) VALUES (@FirstName, @LastName, @Email, @PasswordHash, @UserType, @IsApproved)";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@FirstName", user.FirstName ?? "");
                cmd.Parameters.AddWithValue("@LastName", user.LastName ?? "");
                cmd.Parameters.AddWithValue("@Email", user.Email);
                cmd.Parameters.AddWithValue("@PasswordHash", hashedPassword);
                cmd.Parameters.AddWithValue("@UserType", user.UserType);
                cmd.Parameters.AddWithValue("@IsApproved", user.UserType == "student" ? 1 : 0);

                try
                {
                    cmd.ExecuteNonQuery();
                    return Ok("User registered successfully");
                }
                catch (Exception ex)
                {
                    return InternalServerError(ex);
                }
            }
        }

        [HttpPost]
        [Route("api/auth/login")]
        public IHttpActionResult Login([FromBody] LoginModel login)
        {
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string query = "SELECT UserId, PasswordHash, UserType, IsApproved FROM Users WHERE Email = @Email";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Email", login.Email);

                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        string storedHash = reader["PasswordHash"].ToString();
                        if (VerifyPassword(login.Password, storedHash))
                        {
                            if (Convert.ToBoolean(reader["IsApproved"]))
                            {
                                // Simple session or token
                                return Ok(new { UserId = reader["UserId"], UserType = reader["UserType"] });
                            }
                            return BadRequest("Account not approved");
                        }
                    }
                }
                return BadRequest("Invalid credentials");
            }
        }

        private string HashPassword(string password)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashBytes);
            }
        }

        private bool VerifyPassword(string password, string storedHash)
        {
            string hash = HashPassword(password);
            return hash == storedHash;
        }
    }

    public class UserModel
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string UserType { get; set; }
    }

    public class LoginModel
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}