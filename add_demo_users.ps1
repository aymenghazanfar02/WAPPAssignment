# PowerShell script to add demo user accounts to StudyValyria database
# Run this script from the project directory

# Database connection parameters
$server = "(localdb)\MSSQLLocalDB"
$database = "StudyValyria"

# Function to hash password using SHA256 (same as C# implementation)
function Get-HashedPassword {
    param([string]$password)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $hashBytes = $sha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($password))
    $sha256.Dispose()
    return [Convert]::ToBase64String($hashBytes)
}

# Demo user data
$demoUsers = @(
    @{
        Email = "student@demo.com"
        FirstName = "Demo"
        LastName = "Student"
        Password = "password123"
        Role = "Student"
    },
    @{
        Email = "educator@demo.com"
        FirstName = "Demo"
        LastName = "Educator"
        Password = "password123"
        Role = "Educator"
    },
    @{
        Email = "admin@demo.com"
        FirstName = "Demo"
        LastName = "Admin"
        Password = "password123"
        Role = "Admin"
    }
)

Write-Host "Adding demo users to StudyValyria database..." -ForegroundColor Green

foreach ($user in $demoUsers) {
    $hashedPassword = Get-HashedPassword -password $user.Password
    $sql = "IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = '$($user.Email)') BEGIN INSERT INTO Users (Email, PasswordHash, FirstName, LastName, UserType, IsApproved, CreatedAt) VALUES ('$($user.Email)', '$hashedPassword', '$($user.FirstName)', '$($user.LastName)', '$($user.Role)', 1, GETDATE()) PRINT 'Added user: $($user.Email)' END ELSE BEGIN PRINT 'User already exists: $($user.Email)' END"

    try {
        sqlcmd -S $server -d $database -Q $sql
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Processed user: $($user.Email)" -ForegroundColor Green
        } else {
            Write-Host "Failed to process user: $($user.Email)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "Error processing user $($user.Email): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Demo user setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Demo Accounts (for testing):" -ForegroundColor Yellow
Write-Host "Student: student@demo.com / password123" -ForegroundColor Cyan
Write-Host "Educator: educator@demo.com / password123" -ForegroundColor Cyan
Write-Host "Admin: admin@demo.com / password123" -ForegroundColor Cyan