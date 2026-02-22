const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Students API', () => {
  let app;
  let Student;
  let School;
  let Classroom;
  let Auth;
  let superadminToken;
  let schoolAdminToken;
  let testSchool;
  let testClassroom;
  let testStudent;

  beforeAll(async () => {
    console.log('\n🔧 Setting up Students API tests...');

    const { getModel } = require('../setup');
    app = require('../../app');

    Student = getModel('Student');
    School = getModel('School');
    Classroom = getModel('Classroom');
    Auth = getModel('Auth'); // Your user model
  });

  beforeEach(async () => {
    console.log('\n🔄 Resetting test data...');

    // Clear all data
    await Auth.deleteMany({});
    await School.deleteMany({});
    await Classroom.deleteMany({});
    await Student.deleteMany({});

    // Create test school
    testSchool = await School.create({
      name: 'Test School',
      address: '123 Test St, Test City',
      contactEmail: 'school@test.com',
      phone: '123-456-7890',
      isActive: true
    });

    // Create test classroom
    testClassroom = await Classroom.create({
      name: 'Test Classroom',
      capacity: 30,
      grade: '10',
      section: 'A',
      school: testSchool._id,
      isActive: true
    });

    // Create test student
    testStudent = await Student.create({
      name: 'John Doe',
      // lastName: 'Doe',
      email: 'john.doe@test.com',
      dateOfBirth: new Date('2010-01-01'),
      gender: 'male',
      school: testSchool._id,
      classroom: testClassroom._id,
      isActive: true
    });

    // Create superadmin user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const superadmin = await Auth.create({
      email: 'super@test.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'superadmin',
      isActive: true
    });

    superadminToken = jwt.sign(
      { userId: superadmin._id, email: superadmin.email, role: superadmin.role },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Create school admin
    const schoolAdmin = await Auth.create({
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'School Admin',
      role: 'school_admin',
      schoolId: testSchool._id,
      isActive: true
    });

    schoolAdminToken = jwt.sign(
      {
        userId: schoolAdmin._id,
        email: schoolAdmin.email,
        role: schoolAdmin.role,
        schoolId: schoolAdmin.schoolId
      },
      process.env.JWT_SECRET || 'test-secret'
    );

    console.log('✅ Test data reset complete');
  });

  describe('GET /api/students', () => {
    it('should list all students for superadmin', async () => {
      // Create additional students
      await Student.create({
        name: 'Jane Smith',
        // lastName: 'Smith',
        email: 'jane.smith@test.com',
        school: testSchool._id,
        isActive: true
      });

      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2); // testStudent + new student
    });

    it('should filter students by school', async () => {
      // Create another school
      const otherSchool = await School.create({
        name: 'Other School',
        address: '456 Other St',
        contactEmail: 'other@school.com',
        isActive: true
      });

      // Create student in other school
      await Student.create({
        name: 'Jane Smith',
        // lastName: 'Smith',
        email: 'jane.smith@test.com',
        school: otherSchool._id,
        isActive: true
      });

      const res = await request(app)
        .get('/api/students')
        .query({ schoolId: testSchool._id.toString() })
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].school._id.toString()).toBe(testSchool._id.toString());
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/students');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/schools/:schoolId/students', () => {
    it('should list students by school', async () => {
      // Create additional student in same school
      await Student.create({
        name: 'Jane Smith',
        email: 'jane.smith@test.com',
        school: testSchool._id,
        isActive: true
      });

      const res = await request(app)
        .get(`/api/schools/${testSchool._id}/students`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /api/classrooms/:classroomId/students', () => {
    it('should list students by classroom', async () => {
      // Create additional student in same classroom
      await Student.create({
        name: 'Jane Smith',
        email: 'jane.smith@test.com',
        school: testSchool._id,
        classroom: testClassroom._id,
        isActive: true
      });

      const res = await request(app)
        .get(`/api/classrooms/${testClassroom._id}/students`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /api/students/:id', () => {
    it('should get student by id', async () => {
      const res = await request(app)
        .get(`/api/students/${testStudent._id}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('John Doe');
    });

    it('should return 404 for non-existent student', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/students/${fakeId}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when school admin accesses student from another school', async () => {
      // Create another school and student
      const otherSchool = await School.create({
        name: 'Other School',
        address: '456 Other St',
        isActive: true
      });

      const otherStudent = await Student.create({
        name: 'Jane Smith',
        email: 'jane.smith@test.com',
        school: otherSchool._id,
        isActive: true
      });

      const res = await request(app)
        .get(`/api/students/${otherStudent._id}`)
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/students', () => {
    it('should create a new student for school admin', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          name: 'Jane Smith',
          email: 'jane.smith@test.com',
          dateOfBirth: '2010-05-15',
          gender: 'female',
          schoolId: testSchool._id.toString(),
          grade: '10'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Jane Smith');
      expect(res.body.data.email).toBe('jane.smith@test.com');
      expect(res.body.data.school.toString()).toBe(testSchool._id.toString());
    });

    it('should create a new student for superadmin', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'Jane Smith',
          email: 'jane.smith@test.com',
          dateOfBirth: '2010-05-15',
          gender: 'female',
          schoolId: testSchool._id.toString(),
          grade: '10'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          name: 'Jane'
          // Missing lastName, email, schoolId
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('should return 404 when school does not exist', async () => {
      const nonExistentSchoolId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          name: 'Jane Smith',
          email: 'jane.smith@test.com',
          schoolId: nonExistentSchoolId.toString()
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/school not found/i);
    });

    it('should return 409 when email already exists', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          name: 'Another Student',
          email: 'john.doe@test.com', // This email already exists from testStudent
          schoolId: testSchool._id.toString()
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already exists/i);
    });
  });

  describe('POST /api/students/:id/transfer', () => {
    it('should transfer student to another school', async () => {
      const toSchool = await School.create({
        name: 'To School',
        address: '789 Transfer St',
        isActive: true
      });

      const res = await request(app)
        .post(`/api/students/${testStudent._id}/transfer`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          targetSchoolId: toSchool._id.toString(),
          reason: 'Family moved'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toEqual('Student transferred successfully');
    });

    it('should return 404 when target school not found', async () => {
      const nonExistentSchoolId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/students/${testStudent._id}/transfer`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          targetSchoolId: nonExistentSchoolId.toString(),
          reason: 'Family moved'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/school not found/i);
    });
  });

  describe('POST /api/students/:id/enroll', () => {
    it('should enroll student in classroom', async () => {
      const newClassroom = await Classroom.create({
        name: 'New Classroom',
        capacity: 30,
        school: testSchool._id,
        isActive: true
      });

      const res = await request(app)
        .post(`/api/students/${testStudent._id}/enroll`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          classroomId: newClassroom._id.toString()
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.classroom.toString()).toBe(newClassroom._id.toString());
    });

    it('should prevent enrollment in full classroom', async () => {
      // Create a classroom with capacity 1
      const smallClassroom = await Classroom.create({
        name: 'Small Classroom',
        capacity: 1,
        school: testSchool._id,
        isActive: true
      });

      // Create another student
      const anotherStudent = await Student.create({
        name: 'Jane Smith',
        email: 'jane.smith@test.com',
        school: testSchool._id,
        isActive: true
      });

      // Enroll the first student
      await Student.findByIdAndUpdate(testStudent._id, { classroom: smallClassroom._id });

      // Try to enroll second student
      const res = await request(app)
        .post(`/api/students/${anotherStudent._id}/enroll`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          classroomId: smallClassroom._id.toString()
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/capacity/i);
    });

    it('should return 404 when classroom not found', async () => {
      const nonExistentClassroomId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/students/${testStudent._id}/enroll`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          classroomId: nonExistentClassroomId.toString()
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/classroom not found/i);
    });
  });

  describe('PUT /api/students/:id', () => {
    it('should update student', async () => {
      const res = await request(app)
        .put(`/api/students/${testStudent._id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'John Doe Updated',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('John Doe Updated');
    });

    it('should return 403 when school admin updates student from another school', async () => {
      // Create another school and student
      const otherSchool = await School.create({
        name: 'Other School',
        address: '456 Other St',
        isActive: true
      });

      const otherStudent = await Student.create({
        name: 'Jane Smith',
        email: 'jane.smith@test.com',
        school: otherSchool._id,
        isActive: true
      });

      const res = await request(app)
        .put(`/api/students/${otherStudent._id}`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          firstName: 'Hacked'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/students/:id', () => {
    it('should soft delete student (superadmin only)', async () => {
      const res = await request(app)
        .delete(`/api/students/${testStudent._id}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      // Accept either 200 or 204
      if (res.statusCode === 200) {
        expect(res.body.success).toBe(true);
      } else {
        expect(res.statusCode).toBe(204);
      }

      // Verify student is deactivated
      const deletedStudent = await Student.findById(testStudent._id);
      expect(deletedStudent.isActive).toBe(false);
    });

    it('should prevent school admin from deleting student', async () => {
      const res = await request(app)
        .delete(`/api/students/${testStudent._id}`)
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);

      // Verify student still exists
      const student = await Student.findById(testStudent._id);
      expect(student).not.toBeNull();
    });
  });

});