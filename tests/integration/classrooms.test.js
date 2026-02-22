const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Classrooms API', () => {
  let app;
  let Classroom;
  let School;
  let Student;
  let Auth;
  let superadminToken;
  let schoolAdminToken;
  let testSchool;
  let anotherSchool;
  let testClassroom;

  beforeAll(async () => {
    console.log('\n🔧 Setting up Classrooms API tests...');
    
    const { getModel } = require('../setup');
    app = require('../../app');
    
    Classroom = getModel('Classroom');
    School = getModel('School');
    Student = getModel('Student');
    Auth = getModel('Auth');
  });

  beforeEach(async () => {
    console.log('\n🔄 Resetting test data...');
    
    // Clear all data
    await Auth.deleteMany({});
    await School.deleteMany({});
    await Classroom.deleteMany({});
    await Student.deleteMany({});

    // Create test schools
    testSchool = await School.create({
      name: 'Test School',
      address: '123 Test St, Test City',
      contactEmail: 'school@test.com',
      phone: '123-456-7890',
      isActive: true
    });

    anotherSchool = await School.create({
      name: 'Another School',
      address: '456 Another St, Another City',
      contactEmail: 'another@school.com',
      phone: '987-654-3210',
      isActive: true
    });

    // Create test classroom
    testClassroom = await Classroom.create({
      name: 'Test Classroom',
      capacity: 30,
      grade: '10',
      section: 'A',
      resources: ['projector', 'smartboard'],
      school: testSchool._id,
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

  describe('GET /api/classrooms', () => {
    it('should list all classrooms for superadmin', async () => {
      // Create additional classroom in another school
      await Classroom.create({
        name: 'Another Classroom',
        capacity: 25,
        school: anotherSchool._id,
        isActive: true
      });

      const res = await request(app)
        .get('/api/classrooms')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0]).toHaveProperty('studentCount');
      expect(res.body.data[0]).toHaveProperty('availableSeats');
    });

    it('should filter classrooms by school for superadmin', async () => {
      // Create classroom in another school
      await Classroom.create({
        name: 'Another Classroom',
        capacity: 25,
        school: anotherSchool._id,
        isActive: true
      });

      const res = await request(app)
        .get('/api/classrooms')
        .query({ schoolId: testSchool._id.toString() })
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].school._id.toString()).toBe(testSchool._id.toString());
    });

    it('should filter classrooms by grade', async () => {
      await Classroom.create({
        name: 'Grade 9 Classroom',
        capacity: 30,
        grade: '9',
        school: testSchool._id,
        isActive: true
      });

      const res = await request(app)
        .get('/api/classrooms')
        .query({ grade: '10' })
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].grade).toBe('10');
    });

    it('should filter by active status', async () => {
      await Classroom.create({
        name: 'Inactive Classroom',
        capacity: 30,
        school: testSchool._id,
        isActive: false
      });

      const res = await request(app)
        .get('/api/classrooms')
        .query({ isActive: 'true' })
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].isActive).toBe(true);
    });

    it('should only show own school classrooms for school admin', async () => {
      // Create classroom in another school
      await Classroom.create({
        name: 'Another Classroom',
        capacity: 25,
        school: anotherSchool._id,
        isActive: true
      });

      const res = await request(app)
        .get('/api/classrooms')
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].school._id.toString()).toBe(testSchool._id.toString());
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/classrooms');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/schools/:schoolId/classrooms', () => {
    it('should list classrooms by school', async () => {
      // Create additional classroom in same school
      await Classroom.create({
        name: 'Another Classroom',
        capacity: 25,
        school: testSchool._id,
        isActive: true
      });

      const res = await request(app)
        .get(`/api/schools/${testSchool._id}/classrooms`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should return 404 when school does not exist', async () => {
      const nonExistentSchoolId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/schools/${nonExistentSchoolId}/classrooms`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/school not found/i);
    });

    it('should return 403 when school admin tries to access another school', async () => {
      const res = await request(app)
        .get(`/api/schools/${anotherSchool._id}/classrooms`)
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/only access classrooms from your own school/i);
    });
  });

  describe('GET /api/classrooms/:id', () => {
    it('should get classroom by id', async () => {
      const res = await request(app)
        .get(`/api/classrooms/${testClassroom._id}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Classroom');
      expect(res.body.data.capacity).toBe(30);
      expect(res.body.data).toHaveProperty('studentCount');
      expect(res.body.data).toHaveProperty('availableSeats');
    });

    it('should return 404 for non-existent classroom', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/classrooms/${fakeId}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/classroom not found/i);
    });

    it('should return 403 when school admin accesses classroom from another school', async () => {
      const classroomInAnotherSchool = await Classroom.create({
        name: 'Another School Classroom',
        capacity: 25,
        school: anotherSchool._id,
        isActive: true
      });

      const res = await request(app)
        .get(`/api/classrooms/${classroomInAnotherSchool._id}`)
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/only access classrooms from your own school/i);
    });
  });

  describe('POST /api/schools/:schoolId/classrooms', () => {
    it('should create a new classroom in school', async () => {
      const res = await request(app)
        .post(`/api/schools/${testSchool._id}/classrooms`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'New Classroom',
          capacity: 35,
          grade: '11',
          section: 'B',
          resources: ['projector', 'computers']
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Classroom');
      expect(res.body.data.capacity).toBe(35);
      expect(res.body.data.grade).toBe('11');
      expect(res.body.data.section).toBe('B');
      expect(res.body.data.resources).toContain('projector');
      expect(res.body.data.resources).toContain('computers');
      expect(res.body.data.school.toString()).toBe(testSchool._id.toString());
    });

    it('should create a new classroom for school admin', async () => {
      const res = await request(app)
        .post(`/api/schools/${testSchool._id}/classrooms`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          name: 'Admin Classroom',
          capacity: 30,
          grade: '10',
          section: 'C'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Admin Classroom');
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post(`/api/schools/${testSchool._id}/classrooms`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          // Missing name
          capacity: 30
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/classroom name and school ID are required/i);
    });

    it('should return 404 when school does not exist', async () => {
      const nonExistentSchoolId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/schools/${nonExistentSchoolId}/classrooms`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'New Classroom',
          capacity: 30
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/school not found/i);
    });

    it('should return 409 when classroom name already exists in school', async () => {
      const res = await request(app)
        .post(`/api/schools/${testSchool._id}/classrooms`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'Test Classroom', // Already exists
          capacity: 30
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already exists/i);
    });

    it('should return 403 when school admin tries to create in another school', async () => {
      const res = await request(app)
        .post(`/api/schools/${anotherSchool._id}/classrooms`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          name: 'New Classroom',
          capacity: 30
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/only create classrooms in your own school/i);
    });
  });

  describe('PUT /api/classrooms/:id', () => {
    // it('should update classroom', async () => {
    //   const res = await request(app)
    //     .put(`/api/classrooms/${testClassroom._id}`)
    //     .set('Authorization', `Bearer ${superadminToken}`)
    //     .send({
    //       name: 'Updated Classroom',
    //       capacity: 40,
    //       grade: '12',
    //       section: 'D'
    //     });

    //   expect(res.statusCode).toBe(200);
    //   expect(res.body.success).toBe(true);
    //   expect(res.body.data.name).toBe('Updated Classroom');
    //   expect(res.body.data.capacity).toBe(40);
    //   expect(res.body.data.grade).toBe('12');
    //   expect(res.body.data.section).toBe('D');
    // });

    it('should update classroom for school admin', async () => {
      const res = await request(app)
        .put(`/api/classrooms/${testClassroom._id}`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          name: 'Admin Updated Classroom'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Admin Updated Classroom');
    });

    // it('should return 404 for non-existent classroom', async () => {
    //   const fakeId = new mongoose.Types.ObjectId();
    //   const res = await request(app)
    //     .put(`/api/classrooms/${fakeId}`)
    //     .set('Authorization', `Bearer ${superadminToken}`)
    //     .send({
    //       name: 'Updated Classroom'
    //     });

    //   expect(res.statusCode).toBe(404);
    //   expect(res.body.success).toBe(false);
    //   expect(res.body.error).toMatch(/classroom not found/i);
    // });

    // it('should return 409 when updating to a name that already exists', async () => {
    //   // Create another classroom
    //   const anotherClassroom = await Classroom.create({
    //     name: 'Another Classroom',
    //     capacity: 25,
    //     school: testSchool._id,
    //     isActive: true
    //   });

    //   const res = await request(app)
    //     .put(`/api/classrooms/${anotherClassroom._id}`)
    //     .set('Authorization', `Bearer ${superadminToken}`)
    //     .send({
    //       name: 'Test Classroom' // Already exists
    //     });

    //   expect(res.statusCode).toBe(409);
    //   expect(res.body.success).toBe(false);
    //   expect(res.body.error).toMatch(/already exists/i);
    // });

    // it('should return 400 when trying to reduce capacity below student count', async () => {
    //   // Create a student in the classroom
    //   await Student.create({
    //     name: 'John Doe',
    //     email: 'john.doe@test.com',
    //     school: testSchool._id,
    //     classroom: testClassroom._id,
    //     isActive: true
    //   });
    //     await Student.create({
    //     name: 'John Smith',
    //     email: 'john.smith@test.com',
    //     school: testSchool._id,
    //     classroom: testClassroom._id,
    //     isActive: true
    //   });

    //   const res = await request(app)
    //     .put(`/api/classrooms/${testClassroom._id}`)
    //     .set('Authorization', `Bearer ${superadminToken}`)
    //     .send({
    //       capacity: 1 // Less than current student count
    //     });

    //   expect(res.statusCode).toBe(400);
    //   expect(res.body.success).toBe(false);
    //   expect(res.body.error).toMatch(/cannot reduce capacity/i);
    // });

    // it('should return 403 when school admin updates classroom from another school', async () => {
    //   const classroomInAnotherSchool = await Classroom.create({
    //     name: 'Another School Classroom',
    //     capacity: 25,
    //     school: anotherSchool._id,
    //     isActive: true
    //   });

    //   const res = await request(app)
    //     .put(`/api/classrooms/${classroomInAnotherSchool._id}`)
    //     .set('Authorization', `Bearer ${schoolAdminToken}`)
    //     .send({
    //       name: 'Hacked Classroom'
    //     });

    //   expect(res.statusCode).toBe(403);
    //   expect(res.body.success).toBe(false);
    //   expect(res.body.error).toMatch(/only update classrooms from your own school/i);
    // });
  });

  describe('DELETE /api/classrooms/:id', () => {
    it('should delete classroom (superadmin only)', async () => {
      const classroomToDelete = await Classroom.create({
        name: 'Delete Me',
        capacity: 20,
        school: testSchool._id,
        isActive: true
      });

      const res = await request(app)
        .delete(`/api/classrooms/${classroomToDelete._id}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      // Accept either 200 or 204
      if (res.statusCode === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data.message).toMatch(/deleted/i);
      } else {
        expect(res.statusCode).toBe(204);
      }

      // Verify classroom is deleted
      const deletedClassroom = await Classroom.findById(classroomToDelete._id);
      expect(deletedClassroom).toBeNull();
    });

    it('should return 403 for trying to delete classroom for school admin in their own school', async () => {
      const classroomToDelete = await Classroom.create({
        name: 'Delete Me',
        capacity: 20,
        school: testSchool._id,
        isActive: true
      });

      const res = await request(app)
        .delete(`/api/classrooms/${classroomToDelete._id}`)
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent classroom', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/classrooms/${fakeId}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when trying to delete classroom with students', async () => {
      // Create a student in the classroom
      await Student.create({
        name: 'John Doe',
        email: 'john.doe@test.com',
        school: testSchool._id,
        classroom: testClassroom._id,
        isActive: true
      });

      const res = await request(app)
        .delete(`/api/classrooms/${testClassroom._id}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/cannot delete classroom with assigned students/i);
    });

    it('should return 403 when school admin tries to delete classroom from another school', async () => {
      const classroomInAnotherSchool = await Classroom.create({
        name: 'Another School Classroom',
        capacity: 25,
        school: anotherSchool._id,
        isActive: true
      });

      const res = await request(app)
        .delete(`/api/classrooms/${classroomInAnotherSchool._id}`)
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/access denied/i);
    });
  });

  describe('GET /api/classrooms/:id/stats', () => {
    it('should get classroom statistics', async () => {
      // Create students in the classroom
      await Student.create({
        name: 'John Doe',
        email: 'john.doe@test.com',
        school: testSchool._id,
        classroom: testClassroom._id,
        isActive: true
      });

      await Student.create({
        name: 'Jane Smith',
        email: 'jane.smith@test.com',
        school: testSchool._id,
        classroom: testClassroom._id,
        isActive: true
      });

      const res = await request(app)
        .get(`/api/classrooms/${testClassroom._id}/stats`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalStudents', 2);
      expect(res.body.data).toHaveProperty('activeStudents', 2);
      expect(res.body.data).toHaveProperty('availableSeats', 28); // 30 - 2
      expect(res.body.data).toHaveProperty('utilizationRate');
    });

    it('should return 404 for non-existent classroom', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/classrooms/${fakeId}/stats`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/classrooms/:id/students', () => {
    it('should get students in classroom', async () => {
      // Create students in the classroom
      await Student.create({
        name: 'John Doe',
        email: 'john.doe@test.com',
        school: testSchool._id,
        classroom: testClassroom._id,
        isActive: true
      });

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

  describe('PATCH /api/classrooms/:id/capacity', () => {
    it('should update classroom capacity', async () => {
      const res = await request(app)
        .patch(`/api/classrooms/${testClassroom._id}/capacity`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          capacity: 35
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.capacity).toBe(35);
    });

    it('should return 400 when capacity is less than student count', async () => {
      // Create a student in the classroom
      await Student.create({
        name: 'John Doe',
        email: 'john.doe@test.com',
        school: testSchool._id,
        classroom: testClassroom._id,
        isActive: true
      });
      await Student.create({
        name: 'John Smith',
        email: 'john.smith@test.com',
        school: testSchool._id,
        classroom: testClassroom._id,
        isActive: true
      });

      const res = await request(app)
        .patch(`/api/classrooms/${testClassroom._id}/capacity`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          capacity: 1
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/cannot set capacity below current student count/i);
    });
  });

  describe('POST /api/classrooms/:id/resources', () => {
    it('should add resource to classroom', async () => {
      const res = await request(app)
        .post(`/api/classrooms/${testClassroom._id}/resources`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          resource: 'computers'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resources).toContain('computers');
    });

    it('should not add duplicate resource', async () => {
      // Add resource once
      await request(app)
        .post(`/api/classrooms/${testClassroom._id}/resources`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          resource: 'projector'
        });

      // Try to add same resource again
      const res = await request(app)
        .post(`/api/classrooms/${testClassroom._id}/resources`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          resource: 'projector'
        });

      expect(res.statusCode).toBe(201);
      // Should still have only one projector
      const projectorCount = res.body.data.resources.filter(r => r === 'projector').length;
      expect(projectorCount).toBe(1);
    });
  });

  describe('DELETE /api/classrooms/:id/resources/:resource', () => {
    it('should remove resource from classroom', async () => {
      const res = await request(app)
        .delete(`/api/classrooms/${testClassroom._id}/resources/projector`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resources).not.toContain('projector');
    });
  });
});