# School Management System API Documentation

## Base Information

- **Base URL**: `http://localhost:3000/api`
- **API Version**: 1.0.0
- **Content Type**: `application/json`

---

## Classroom Flow

## Classrooms Endpoints

## List All Classrooms
Retrieves a list of all classrooms.

Endpoint: GET /classrooms

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Query Parameters:

## Parameter	Type	Description
schoolId	string	Filter by school
grade	string	Filter by grade
isActive	boolean	Filter by active status

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
      "resources": ["projector", "smartboard"],
      "school": {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "Springfield Elementary"
      },
      "isActive": true,
      "studentCount": 25,
      "availableSeats": 5
    }
  ]
}

## Get Classroom by ID
Retrieves a specific classroom by its ID.

Endpoint: GET /classrooms/:id

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Success Response (200 OK):

{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c91",
    "name": "Room 101",
    "capacity": 30,
    "grade": "10",
    "section": "A",
    "resources": ["projector", "smartboard"],
    "school": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Springfield Elementary"
    },
    "isActive": true,
    "studentCount": 25,
    "availableSeats": 5
  }
}

## Error Responses:

404 Not Found - Classroom not found

403 Forbidden - Access denied (school admin accessing another school's classroom)

## Create Classroom
Creates a new classroom in a school.

Endpoint: POST /schools/:schoolId/classrooms

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

URL Parameters:

Parameter	Type	Description
schoolId	string	School ID
Request Body:

{
  "name": "Room 102",
  "capacity": 35,
  "grade": "11",
  "section": "B",
  "resources": ["projector", "computers"]
}

## Validation Rules:

name: Required, unique within school

capacity: Optional, defaults to 30

Other fields are optional

Success Response (201 Created):

{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c92",
    "name": "Room 102",
    "capacity": 35,
    "grade": "11",
    "section": "B",
    "resources": ["projector", "computers"],
    "school": "60d21b4667d0d8992e610c85",
    "isActive": true
  }
}

## Error Responses:

400 Bad Request - Missing name or schoolId

403 Forbidden - Cannot create in another school

404 Not Found - School not found

409 Conflict - Duplicate name in school

## Update Classroom
Updates an existing classroom.

Endpoint: PUT /classrooms/:id

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Request Body: (all fields optional)

{
  "name": "Updated Room",
  "capacity": 40,
  "grade": "12",
  "section": "C",
  "resources": ["projector", "smartboard", "ac"]
}

Success Response (200 OK):

{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c91",
    "name": "Updated Room",
    "capacity": 40,
    "grade": "12",
    "section": "C",
    "resources": ["projector", "smartboard", "ac"],
    "isActive": true
  }
}

## Error Responses:

400 Bad Request - Cannot reduce capacity below student count

403 Forbidden - Cannot update another school's classroom

404 Not Found - Classroom not found

409 Conflict - Duplicate name

## Delete Classroom
Deletes a classroom. Cannot delete classrooms with assigned students.

Endpoint: DELETE /classrooms/:id

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Success Response (204 No Content) or (200 OK)
{
  "success": true,
  "data": {
    "message": "Classroom deleted successfully"
  }
}

## Error Responses:

400 Bad Request - Classroom has students

403 Forbidden - Cannot delete another school's classroom

404 Not Found - Classroom not found

## Get Classroom Statistics
Returns statistics for a specific classroom.

Endpoint: GET /classrooms/:id/stats

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Success Response (200 OK):

{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c91",
    "name": "Room 101",
    "capacity": 30,
    "totalStudents": 25,
    "activeStudents": 23,
    "availableSeats": 7,
    "utilizationRate": "76.67",
    "resources": ["projector", "smartboard"],
    "grade": "10",
    "section": "A",
    "isActive": true
  }
}

## Get Students in Classroom
Retrieves all students in a specific classroom.

Endpoint: GET /classrooms/:id/students

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
      "grade": "10"
    }
  ]
}

## List Classrooms by School
## Retrieves all classrooms in a specific school.

Endpoint: GET /schools/:schoolId/classrooms

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
      "studentCount": 25,
      "availableSeats": 5
    }
  ]
}

## Update Classroom Capacity
Updates only the capacity of a classroom.

Endpoint: PATCH /classrooms/:id/capacity

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Request Body:

{
  "capacity": 35
}

Success Response (200 OK):

{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c91",
    "capacity": 35
  }
}

## Add Resource to Classroom
Adds a resource to a classroom.

Endpoint: POST /classrooms/:id/resources

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Request Body:
{
  "resource": "computers"
}

Success Response (200 OK):

{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c91",
    "resources": ["projector", "smartboard", "computers"]
  }
}

## Remove Resource from Classroom
Removes a resource from a classroom.

Endpoint: DELETE /classrooms/:id/resources/:resource

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

URL Parameters:

Parameter	Type	Description
id	string	Classroom ID
resource	string	Resource name
Success Response (200 OK):

{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c91",
    "resources": ["projector", "smartboard"]
  }
}

## Bulk Create Classrooms
Creates multiple classrooms at once.

Endpoint: POST /classrooms/bulk/create

Access: Protected (Superadmin only)

Headers:
Authorization: Bearer <token>

Request Body:
{
  "classrooms": [
    {
      "name": "Room A",
      "capacity": 30,
      "schoolId": "60d21b4667d0d8992e610c85"
    },
    {
      "name": "Room B",
      "capacity": 25,
      "schoolId": "60d21b4667d0d8992e610c85"
    }
  ]
}

Success Response (200 OK):

{
  "success": true,
  "data": {
    "created": [
      { "_id": "...", "name": "Room A" },
      { "_id": "...", "name": "Room B" }
    ],
    "errors": [],
    "totalCreated": 2,
    "totalErrors": 0
  }
}