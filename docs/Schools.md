# School Management System API Documentation

## Base Information

- **Base URL**: `http://localhost:3000/api`
- **API Version**: 1.0.0
- **Content Type**: `application/json`

---

## School Flow

## Schools Endpoints

## List All Schools
Retrieves a list of all schools.

Endpoint: GET /schools

Access: Protected (Superadmin, School Admin)

Headers:

Authorization: Bearer <token>

## Query Parameters:

Parameter	Type	Description
isActive	boolean	Filter by active status
city	string	Filter by city

## Success Response (200 OK):
{
  "success": true,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Springfield Elementary",
      "address": "123 Main St, Springfield, IL 62701",
      "contactEmail": "info@springfield.edu",
      "phone": "555-123-4567",
      "principal": {
        "name": "Principal Skinner",
        "email": "skinner@springfield.edu",
        "phone": "555-123-4568"
      },
      "isActive": true,
      "createdAt": "2023-01-15T08:00:00.000Z",
      "updatedAt": "2023-06-15T10:30:00.000Z"
    }
  ]
}
Note: School admins only see their own school.

## Get School by ID
Retrieves a specific school by its ID.

Endpoint: GET /schools/:id

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

URL Parameters:

Parameter	Type	Description
id	string	School ID (MongoDB ObjectId)

Success Response (200 OK):
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Springfield Elementary",
    "address": "123 Main St, Springfield, IL 62701",
    "contactEmail": "info@springfield.edu",
    "phone": "555-123-4567",
    "principal": {
      "name": "Principal Skinner",
      "email": "skinner@springfield.edu",
      "phone": "555-123-4568"
    },
    "isActive": true,
    "createdAt": "2023-01-15T08:00:00.000Z",
    "updatedAt": "2023-06-15T10:30:00.000Z"
  }
}

## Error Responses:

## 400 Bad Request - Invalid ID format

{
  "success": false,
  "error": "Invalid school ID format"
}

403 Forbidden - Access denied

{
  "success": false,
  "error": "You can only access your own school"
}

404 Not Found - School not found
{
  "success": false,
  "error": "School not found"
}

## Create School
Creates a new school.

Endpoint: POST /schools

Access: Protected (Superadmin only)

Headers:
Authorization: Bearer <token>

Request Body:

{
  "name": "New School",
  "address": "456 Education Ave, Learning City, ST 12345",
  "contactEmail": "contact@newschool.edu",
  "phone": "555-987-6543",
  "principal": {
    "name": "Jane Principal",
    "email": "jane.principal@newschool.edu",
    "phone": "555-987-6544"
  }
}

## Validation Rules:

name: Required, unique

All other fields are optional

Success Response (201 Created):

{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c90",
    "name": "New School",
    "address": "456 Education Ave, Learning City, ST 12345",
    "contactEmail": "contact@newschool.edu",
    "phone": "555-987-6543",
    "principal": {
      "name": "Jane Principal",
      "email": "jane.principal@newschool.edu",
      "phone": "555-987-6544"
    },
    "isActive": true,
    "createdAt": "2023-06-15T10:30:00.000Z",
    "updatedAt": "2023-06-15T10:30:00.000Z"
  }
}

## Error Responses:

400 Bad Request - Missing name

{
  "success": false,
  "error": "School name is required"
}

403 Forbidden - Insufficient permissions
{
  "success": false,
  "error": "Only superadmins can create schools"
}

409 Conflict - Duplicate name

{
  "success": false,
  "error": "School with this name already exists"
}

## Update School
Updates an existing school.

Endpoint: PUT /schools/:id

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

URL Parameters:

Parameter	Type	Description
id	string	School ID (MongoDB ObjectId)

Request Body: (all fields optional)

{
  "name": "Updated School Name",
  "address": "789 New Address",
  "contactEmail": "updated@school.edu",
  "phone": "555-111-2222",
  "principal": {
    "name": "New Principal"
  }
}

Success Response (200 OK):

{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Updated School Name",
    "address": "789 New Address",
    "contactEmail": "updated@school.edu",
    "phone": "555-111-2222",
    "principal": {
      "name": "New Principal"
    },
    "isActive": true,
    "updatedAt": "2023-06-15T11:30:00.000Z"
  }
}

## Error Responses:

400 Bad Request - Invalid ID format

403 Forbidden - Cannot update other school

404 Not Found - School not found

409 Conflict - Duplicate name

## Delete School
Deletes a school (superadmin only). Cannot delete schools with existing classrooms or students.

Endpoint: DELETE /schools/:id

Access: Protected (Superadmin only)

Headers:
Authorization: Bearer <token>

URL Parameters:

Parameter	Type	Description
id	string	School ID (MongoDB ObjectId)

Success Response (204 No Content): No response body

## Error Responses:

400 Bad Request - School has associated classrooms/students

{
  "success": false,
  "error": "Cannot delete school with existing classrooms"
}

403 Forbidden - Insufficient permissions

404 Not Found - School not found

## Get School Statistics
Returns statistics about schools.

Endpoint: GET /schools/stats/overview

Access: Protected (Superadmin only)

Headers:
Authorization: Bearer <token>

Success Response (200 OK):

{
  "success": true,
  "data": {
    "totalSchools": 5,
    "totalClassrooms": 23,
    "totalStudents": 450,
    "schools": [
      {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "Springfield Elementary",
        "classroomCount": 8,
        "studentCount": 150
      }
    ]
  }
}

## Get School Classrooms
Retrieves all classrooms in a specific school.

Endpoint: GET /schools/:id/classrooms

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Success Response (200 OK):
{
  "success": true,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c91",
      "name": "Room 101",
      "capacity": 30,
      "grade": "10",
      "section": "A",
      "studentCount": 25,
      "availableSeats": 5
    }
  ]
}

## Get School Students
Retrieves all students in a specific school.

Endpoint: GET /schools/:id/students

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Success Response (200 OK):

{
  "success": true,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c95",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "grade": "10",
      "classroom": {
        "_id": "60d21b4667d0d8992e610c91",
        "name": "Room 101"
      }
    }
  ]
}

## Toggle School Status
Activates or deactivates a school.

Endpoint: PATCH /schools/:id/toggle-status

Access: Protected (Superadmin only)

Headers:
Authorization: Bearer <token>

Success Response (200 OK):
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "isActive": false,
    "message": "School deactivated successfully"
  }
}