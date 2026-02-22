# School Management System API Documentation

## Base Information

- **Base URL**: `http://localhost:3000/api`
- **API Version**: 1.0.0
- **Content Type**: `application/json`

---

## Student Flow

## Students Endpoints
## List All Students
Retrieves a list of all students.

Endpoint: GET /students

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Query Parameters:

`Parameter	Type	Description`
schoolId	string	Filter by school
classroomId	string	Filter by classroom
grade	string	Filter by grade
isActive	boolean	Filter by active status
search	string	Search by name or email

Success Response (200 OK):

{
  "success": true,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c95",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "dateOfBirth": "2010-05-15T00:00:00.000Z",
      "gender": "male",
      "school": {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "Springfield Elementary"
      },
      "classroom": {
        "_id": "60d21b4667d0d8992e610c91",
        "name": "Room 101"
      },
      "grade": "10",
      "isActive": true
    }
  ]
}

## Get Student by ID
Retrieves a specific student by ID.

`Endpoint: GET /students/:id`

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Success Response (200 OK):

{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c95",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "dateOfBirth": "2010-05-15T00:00:00.000Z",
    "gender": "male",
    "address": {
      "street": "123 Home St",
      "city": "Springfield",
      "state": "IL",
      "zipCode": "62701",
      "country": "USA"
    },
    "phone": "555-123-4567",
    "school": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Springfield Elementary"
    },
    "classroom": {
      "_id": "60d21b4667d0d8992e610c91",
      "name": "Room 101"
    },
    "grade": "10",
    "enrollmentDate": "2023-09-01T00:00:00.000Z",
    "isActive": true,
    "emergencyContact": {
      "name": "Jane Doe",
      "relationship": "Mother",
      "phone": "555-123-4568"
    }
  }
}

## Create Student
Creates a new student.

`Endpoint: POST /students`

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Request Body:
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "dateOfBirth": "2011-08-20",
  "gender": "female",
  "schoolId": "60d21b4667d0d8992e610c85",
  "classroomId": "60d21b4667d0d8992e610c91",
  "grade": "9",
  "address": {
    "street": "456 Oak Ave",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62702"
  },
  "phone": "555-987-6543",
  "emergencyContact": {
    "name": "John Smith",
    "relationship": "Father",
    "phone": "555-987-6544"
  }
}

## Validation Rules:

firstName, lastName, schoolId: Required

email: Optional, but must be unique if provided

classroomId: Optional, must belong to the specified school

Classroom capacity will be checked

Success Response (201 Created):
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c96",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "school": "60d21b4667d0d8992e610c85",
    "classroom": "60d21b4667d0d8992e610c91",
    "isActive": true
  }
}

## Update Student
Updates an existing student.

`Endpoint: PUT /students/:id`

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Request Body: (all fields optional)
{
  "firstName": "Jane Updated",
  "lastName": "Smith Updated",
  "phone": "555-111-2222",
  "classroomId": "60d21b4667d0d8992e610c92"
}

Success Response (200 OK):

{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c96",
    "firstName": "Jane Updated",
    "lastName": "Smith Updated",
    "phone": "555-111-2222",
    "classroom": "60d21b4667d0d8992e610c92"
  }
}

## Delete Student (Deactivate)
Soft deletes a student by setting isActive to false.

`Endpoint: DELETE /students/:id`

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Success Response (200 OK) or (204 No Content):
{
  "success": true,
  "data": {
    "message": "Student deactivated successfully"
  }
}

## List Students by School
Retrieves all students in a specific school.

`Endpoint: GET /schools/:schoolId/students`

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
      "classroom": {
        "_id": "60d21b4667d0d8992e610c91",
        "name": "Room 101"
      }
    }
  ]
}

## List Students by Classroom
Retrieves all students in a specific classroom.

`Endpoint: GET /classrooms/:classroomId/students`

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
      "email": "john.doe@example.com"
    }
  ]
}

## Transfer Student
Transfers a student to another school and optionally to a classroom.

`Endpoint: POST /students/:id/transfer`

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Request Body:
{
  "targetSchoolId": "60d21b4667d0d8992e610c86",
  "targetClassroomId": "60d21b4667d0d8992e610c93",
  "reason": "Family moved"
}

Success Response (200 OK):

{
  "success": true,
  "data": {
    "message": "Student transferred successfully",
    "student": {
      "_id": "60d21b4667d0d8992e610c95",
      "school": "60d21b4667d0d8992e610c86",
      "classroom": "60d21b4667d0d8992e610c93"
    },
    "transferRecord": {
      "fromSchool": "60d21b4667d0d8992e610c85",
      "toSchool": "60d21b4667d0d8992e610c86",
      "fromClassroom": "60d21b4667d0d8992e610c91",
      "toClassroom": "60d21b4667d0d8992e610c93",
      "date": "2023-06-15T14:30:00.000Z",
      "reason": "Family moved"
    }
  }
}

## Enroll Student in Classroom
Enrolls a student in a classroom within the same school.

`Endpoint: POST /students/:id/enroll`

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Request Body:
{
  "classroomId": "60d21b4667d0d8992e610c92"
}

Success Response (200 OK):

{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c95",
    "classroom": "60d21b4667d0d8992e610c92"
  }
}

## Withdraw Student
Withdraws a student from the school (soft delete with history).

`Endpoint: POST /students/:id/withdraw`

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Request Body:

{
  "reason": "Moved to another district"
}

Success Response (200 OK):
{
  "success": true,
  "data": {
    "message": "Student withdrawn successfully"
  }
}

## Search Students
Searches for students by name or email.

`Endpoint: GET /students/search`

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Query Parameters:

Parameter	Type	Description
q	string	Search query (required)
schoolId	string	Filter by school

Success Response (200 OK):

{
  "success": true,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c95",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "school": {
        "name": "Springfield Elementary"
      }
    }
  ]
}

## Get Student Statistics
Returns overall student statistics.

`Endpoint: GET /students/stats/overview`

Access: Protected (Superadmin only)

Headers:
Authorization: Bearer <token>

Success Response (200 OK):
{
  "success": true,
  "data": {
    "totalStudents": 450,
    "totalMale": 230,
    "totalFemale": 215,
    "totalOther": 5,
    "studentsByGrade": [
      { "_id": "9", "count": 120 },
      { "_id": "10", "count": 115 },
      { "_id": "11", "count": 110 },
      { "_id": "12", "count": 105 }
    ],
    "recentEnrollments": 45,
    "activePercentage": 95.5
  }
}

## Get School Student Statistics
Returns student statistics for a specific school.

`Endpoint: GET /schools/:schoolId/students/stats`

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Success Response (200 OK):
{
  "success": true,
  "data": {
    "schoolId": "60d21b4667d0d8992e610c85",
    "totalStudents": 150,
    "studentsByClassroom": [
      { "_id": "60d21b4667d0d8992e610c91", "count": 25 },
      { "_id": "60d21b4667d0d8992e610c92", "count": 30 }
    ]
  }
}

## Get Student Attendance
Placeholder for attendance tracking.

`Endpoint: GET /students/:id/attendance`

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Query Parameters:

Parameter	Type	Description
startDate	string	Start date (ISO format)
endDate	string	End date (ISO format)

Success Response (200 OK):

{
  "success": true,
  "data": {
    "message": "Attendance tracking coming soon",
    "studentId": "60d21b4667d0d8992e610c95",
    "dateRange": {
      "startDate": "2023-01-01",
      "endDate": "2023-01-31"
    }
  }
}

## Get Student Grades
Placeholder for grade tracking.

`Endpoint: GET /students/:id/grades`

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Success Response (200 OK):

{
  "success": true,
  "data": {
    "message": "Grade tracking coming soon",
    "studentId": "60d21b4667d0d8992e610c95"
  }
}

## Get Student Timeline
Returns the student's history (enrollment, transfers, etc.).

`Endpoint: GET /students/:id/timeline`

Access: Protected (Superadmin, School Admin)

Headers:
Authorization: Bearer <token>

Success Response (200 OK):

{
  "success": true,
  "data": [
    {
      "type": "enrollment",
      "date": "2023-09-01T00:00:00.000Z",
      "description": "Student enrolled"
    },
    {
      "type": "transfer",
      "date": "2024-01-15T00:00:00.000Z",
      "description": "Family moved",
      "details": {
        "fromSchool": "60d21b4667d0d8992e610c85",
        "toSchool": "60d21b4667d0d8992e610c86"
      }
    }
  ]
}

## Bulk Import Students
Creates multiple students at once.

`Endpoint: POST /students/bulk/import`

Access: Protected (Superadmin only)

Headers:
Authorization: Bearer <token>

Request Body:

{
  "students": [
    {
      "firstName": "Student1",
      "lastName": "Last1",
      "email": "student1@example.com",
      "schoolId": "60d21b4667d0d8992e610c85"
    },
    {
      "firstName": "Student2",
      "lastName": "Last2",
      "email": "student2@example.com",
      "schoolId": "60d21b4667d0d8992e610c85"
    }
  ]
}

Success Response (200 OK):

{
  "success": true,
  "data": {
    "created": [...],
    "errors": [],
    "totalCreated": 2,
    "totalErrors": 0
  }
}

## Bulk Transfer Students
Transfers multiple students at once.

`Endpoint: POST /students/bulk/transfer`

Access: Protected (Superadmin only)

Headers:
Authorization: Bearer <token>

Request Body:

{
  "studentIds": [
    "60d21b4667d0d8992e610c95",
    "60d21b4667d0d8992e610c96"
  ],
  "targetSchoolId": "60d21b4667d0d8992e610c86",
  "targetClassroomId": "60d21b4667d0d8992e610c93",
  "reason": "School consolidation"
}

Success Response (200 OK):

{
  "success": true,
  "data": {
    "transferred": [...],
    "failed": []
  }
}

