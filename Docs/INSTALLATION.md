# Installation Guide

## Prerequisites

### For Windows Development
- **Visual Studio 2019 or later** (Community, Professional, or Enterprise)
- **SQL Server** (LocalDB, Express, or full version)
- **.NET Framework 4.8** or later
- **IIS Express** (included with Visual Studio)

### For macOS Development (Alternative Setup)
- **Mono Framework 6.12+** - Download from [mono-project.com](https://www.mono-project.com/download/stable/)
- **Visual Studio for Mac** or **Visual Studio Code**
- **SQL Server** alternatives:
  - **Docker with SQL Server** for Linux containers
  - **PostgreSQL** (requires connection string modification)
  - **SQLite** (requires code modifications)

## Installation Steps

### Windows Setup (Recommended)

1. **Install Visual Studio**
   ```bash
   # Download from https://visualstudio.microsoft.com/
   # Select ASP.NET and web development workload
   ```

2. **Install SQL Server**
   ```bash
   # Option 1: SQL Server Express (free)
   # Download from https://www.microsoft.com/en-us/sql-server/sql-server-downloads
   
   # Option 2: Use LocalDB (included with Visual Studio)
   # No additional installation required
   ```

3. **Clone and Setup Project**
   ```bash
   git clone [repository-url]
   cd WAPPAssignment
   ```

4. **Database Setup**
   - Open SQL Server Management Studio
   - Create database named `StudyValyria`
   - Execute `DatabaseSetup.sql` script

5. **Configure Connection String**
   - Open `Web.config`
   - Update connection string if needed:
   ```xml
   <connectionStrings>
     <add name="DefaultConnection" 
          connectionString="Server=(localdb)\mssqllocaldb;Database=StudyValyria;Trusted_Connection=True;" 
          providerName="System.Data.SqlClient" />
   </connectionStrings>
   ```

6. **Build and Run**
   ```bash
   # Open solution in Visual Studio
   # Press F5 or Ctrl+F5 to run
   ```

### macOS Setup (Using Mono)

1. **Install Mono Framework**
   ```bash
   # Download and install from https://www.mono-project.com/download/stable/
   # Or use Homebrew:
   brew install mono
   ```

2. **Clone Project**
   ```bash
   git clone [repository-url]
   cd WAPPAssignment
   ```

3. **Build Project**
   ```bash
   msbuild WAPPAssignment.sln
   ```

4. **Setup Database**
   ```bash
   # Option 1: Use Docker with SQL Server
   docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourPassword123!" \
      -p 1433:1433 --name sqlserver \
      -d mcr.microsoft.com/mssql/server:2019-latest
   
   # Option 2: Install PostgreSQL and modify connection string
   brew install postgresql
   ```

5. **Run Application**
   ```bash
   xsp4 --port 51264 --root .
   ```

## Environment Configuration

### Development Environment Variables
```bash
# Optional: Set environment-specific configurations
export ASPNET_ENV=Development
export DB_CONNECTION_STRING="your-connection-string"
```

### Production Considerations
- Use IIS for hosting on Windows
- Configure proper SSL certificates
- Update connection strings for production database
- Enable logging and monitoring
- Set compilation debug="false" in Web.config

## Troubleshooting

### Common Issues

1. **"Could not load type 'WAPPAssignment.Global'"**
   - Rebuild the solution
   - Check that Global.asax.cs is properly compiled
   - Verify namespace matches

2. **Database Connection Issues**
   - Verify SQL Server is running
   - Check connection string format
   - Ensure database exists and is accessible

3. **Missing Dependencies**
   - Restore NuGet packages
   - Check .NET Framework version compatibility
   - Verify all required assemblies are referenced

4. **Port Already in Use**
   ```bash
   # Find process using port 51264
   netstat -ano | findstr :51264
   # Kill the process or use different port
   ```

## Verification

After installation, verify the setup:

1. **Application Loads**: Navigate to `http://localhost:51264`
2. **API Endpoints**: Test `http://localhost:51264/api/users`
3. **Database Connection**: Check if sample data loads
4. **Frontend**: Verify static files serve correctly

## Next Steps

- Review [Backend Documentation](BACKEND.md)
- Review [Frontend Documentation](FRONTEND.md)
- Check [API Documentation](API.md) for endpoint details