# School Management System API Documentation

## Dataabase Schema Design Diagram

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      Auth       │       │     School      │       │    Classroom    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ _id             │       │ _id             │       │ _id             │
│ email           │──────▶│ name            │       │ name            │
│ password        │       │ address         │       │ capacity        │
│ name            │       │ contactEmail    │       │ grade           │
│ role            │       │ phone           │       │ section         │
│ schoolId        │◀──────│ principal       │       │ resources[]     │
│ isActive        │       │ isActive        │       │ school          │◀─┐
│ lastLogin       │       │ createdAt       │       │ isActive        │  │
│ createdAt       │       │ updatedAt       │       │ createdAt       │  │
│ updatedAt       │       └─────────────────┘       │ updatedAt       │  │
└─────────────────┘              │                   └─────────────────┘  │
                                 │                                        │
                                 │                   ┌─────────────────┐  │
                                 │                   │    Student      │  │
                                 │                   ├─────────────────┤  │
                                 └──────────────────▶│ _id             │  │
                                                     │ name       │  │
                                                     │ email           │  │
                                                     │ dateOfBirth     │  │
                                                     │ gender          │  │
                                                     │ address         │  │
                                                     │ phone           │  │
                                                     │ school          │──┘
                                                     │ classroom       │──┐
                                                     │ grade           │  │
                                                     │ enrollmentDate  │  │
                                                     │ isActive        │  │
                                                     │ transferHistory │  │
                                                     │ emergencyContact│  │
                                                     │ createdAt       │  │
                                                     │ updatedAt       │  │
                                                     └─────────────────┘  │
                                                                          │
                                                     ┌─────────────────┐  │
                                                     │ TransferHistory │  │
                                                     │ (Embedded)      │  │
                                                     ├─────────────────┤  │
                                                     │ fromSchool      │  │
                                                     │ toSchool        │  │
                                                     │ fromClassroom   │  │
                                                     │ toClassroom     │  │
                                                     │ date            │  │
                                                     │ reason          │  │
                                                     └─────────────────┘  │
                                                                          │
                                                     ┌─────────────────┐  │
                                                     │  EmergencyContact│  │
                                                     │   (Embedded)    │  │
                                                     ├─────────────────┤  │
                                                     │ name            │  │
                                                     │ relationship    │  │
                                                     │ phone           │  │
                                                     └─────────────────┘  │
                                                                          │
                                                     ┌─────────────────┐  │
                                                     │      User       │  │
                                                     ├─────────────────┤  │
                                                     │ _id             │  │
                                                     │ email           │  │
                                                     │ password        │  │
                                                     │ name            │  │
                                                     │ role            │  │
                                                     │ schoolId        │──┘
                                                     │ isActive        │
                                                     │ lastLogin       │
                                                     └─────────────────┘

## Relationships

School has many Classrooms (one-to-many)

School has many Students (one-to-many)

Classroom belongs to one School (many-to-one)

Classroom has many Students (one-to-many)

Student belongs to one School (many-to-one)

Student belongs to one Classroom (many-to-one)

User (Auth) can be associated with one School (if school_admin)