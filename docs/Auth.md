# School Management System API Documentation

## Base Information

- **Base URL**: `http://localhost:3000/api`
- **API Version**: 1.0.0
- **Content Type**: `application/json`

---

## Authentication Flow

### 1. Registration

POST /auth/register


Users can register as either `superadmin` or `school_admin`. School admins must provide a valid `schoolId`.

### 2. Login

POST /auth/login

Returns a JWT token that must be included in subsequent requests.

### 3. Authenticated Requests
Include the token in the Authorization header:

Authorization: Bearer <your-jwt-token>


### 4. Token Refresh
POST /auth/refresh-token


### 5. Logout

POST /auth/logout


### 6. Password Change
POST /auth/change-password

---

## Authentication Endpoints

### Register User

Creates a new user account.

**Endpoint:** `POST /auth/register`

**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "school_admin",
  "schoolId": "60d21b4667d0d8992e610c85"
}

## Validation Rules:

email: Valid email format, unique in system

password: Minimum 6 characters

name: Required

role: Must be either superadmin or school_admin

schoolId: Required for school_admin role, must be a valid MongoDB ObjectId

Success Response (201 Created):

{
  "success": true,
  "data": {
    "user": {
      "_id": "60d21b4667d0d8992e610c86",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "school_admin",
      "schoolId": "60d21b4667d0d8992e610c85"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MGQyMWI0NjY3ZDBkODk5MmU2MTBjODYiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoic2Nob29sX2FkbWluIiwic2Nob29sSWQiOiI2MGQyMWI0NjY3ZDBkODk5MmU2MTBjODUiLCJpYXQiOjE2MjM0NTY3ODksImV4cCI6MTYyMzU0MzE4OX0"
  }
}

Error Responses:

400 Bad Request - Missing required fields

{
  "success": false,
  "error": "Missing required fields: email, password, name"
}

400 Bad Request - Invalid email format
{
  "success": false,
  "error": "Invalid email format"
}

400 Bad Request - Password too short
{
  "success": false,
  "error": "Password must be at least 6 characters long"
}

400 Bad Request - Invalid role
{
  "success": false,
  "error": "Invalid role. Role must be either superadmin or school_admin"
}

400 Bad Request - Missing schoolId for school_admin

{
  "success": false,
  "error": "School ID is required for school administrator"
}

404 Not Found - School doesn't exist
{
  "success": false,
  "error": "School not found"
}

409 Conflict - Email already exists
{
  "success": false,
  "error": "User already exists with this email"
}

Login
Authenticates a user and returns a JWT token.

Endpoint: POST /auth/login

Access: Public

Request Body:

{
  "email": "user@example.com",
  "password": "password123"
}

Success Response (200 OK):
{
  "success": true,
  "data": {
    "user": {
      "_id": "60d21b4667d0d8992e610c86",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "school_admin",
      "schoolId": "60d21b4667d0d8992e610c85"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

Error Responses:

400 Bad Request - Missing credentials
{
  "success": false,
  "error": "Email and password are required"
}

401 Unauthorized - Invalid credentials
{
  "success": false,
  "error": "Invalid credentials"
}

403 Forbidden - Account deactivated
{
  "success": false,
  "error": "Account is deactivated. Please contact administrator."
}

429 Too Many Requests - Rate limit exceeded
{
  "success": false,
  "error": "Too many authentication attempts, please try again after an hour"
}

Get Current User
Returns information about the currently authenticated user.

Endpoint: GET /auth/me

Access: Protected (Valid JWT token required)

Headers:
Authorization: Bearer <token>

Success Response (200 OK):
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c86",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "school_admin",
    "schoolId": "60d21b4667d0d8992e610c85",
    "isActive": true,
    "lastLogin": "2023-06-15T10:30:00.000Z"
  }
}

Error Responses:

401 Unauthorized - No token provided
{
  "success": false,
  "error": "Authentication required"
}

401 Unauthorized - Invalid token
{
  "success": false,
  "error": "Invalid token"
}

Change Password
Allows authenticated user to change their password.

Endpoint: POST /auth/change-password

Access: Protected (Valid JWT token required)

Headers:

Authorization: Bearer <token>

Request Body:
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}

Success Response (201 Created):
{
  "success": true,
  "data": {
    "message": "Password updated successfully"
  }
}

Error Responses:

400 Bad Request - Missing passwords
{
  "success": false,
  "error": "Current password and new password are required"
}

400 Bad Request - New password too short
{
  "success": false,
  "error": "New password must be at least 6 characters long"
}

401 Unauthorized - Incorrect current password
{
  "success": false,
  "error": "Current password is incorrect"
}

401 Unauthorized - User not found
{
  "success": false,
  "error": "User not found"
}

Logout
Logs out the current user (client-side token discard).

Endpoint: POST /auth/logout

Access: Protected (Valid JWT token required)

Headers:

Authorization: Bearer <token>

Success Response (200 OK):
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}

Refresh Token
Obtains a new access token using an existing token.

Endpoint: POST /auth/refresh-token

Access: Public (requires valid token)

Request Body:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Success Response (200 OK):
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

Error Responses:

400 Bad Request - Token not provided
{
  "success": false,
  "error": "Token required"
}

401 Unauthorized - Invalid token
{
  "success": false,
  "error": "Invalid token"
}