// tests/integration/schools.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Schools API', () => {
  let app;
  let School;
  let Auth;
  let superadminToken;
  let schoolAdminToken;
  let testSchool;

  beforeAll(async () => {
    console.log('\n🔧 Setting up Schools API tests...');
    
    const { getModel } = require('../setup');
    app = require('../../app');
    
    School = getModel('School');
    Auth = getModel('Auth');
  });

  // Reset data before each test, not after
  beforeEach(async () => {
    console.log('\n🔄 Resetting test data...');
    
    // Clear all data
    await Auth.deleteMany({});
    await School.deleteMany({});

    // Create fresh test data for each test
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create superadmin
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

    // Create a school for admin
    const schoolId = new mongoose.Types.ObjectId();
    testSchool = await School.create({
      _id: schoolId,
      name: 'Admin School',
      address: '123 Admin St',
      contactEmail: 'admin@school.com',
      phone: '123-456-7890',
      isActive: true
    });

    // Create school admin
    const schoolAdmin = await Auth.create({
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'School Admin',
      role: 'school_admin',
      schoolId: schoolId,
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

    // Create another school (for superadmin to see)
    otherSchool = await School.create({
      name: 'Other School',
      address: '456 Other St',
      contactEmail: 'other@school.com',
      phone: '987-654-3210',
      isActive: true
    });

    console.log('✅ Test data reset complete');
  });

  describe('GET /api/schools', () => {
    it('should list all schools for superadmin', async () => {
      const res = await request(app)
        .get('/api/schools')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should only show own school for school admin', async () => {
      const res = await request(app)
        .get('/api/schools')
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Admin School');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/schools');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/schools/:id', () => {
    it('should get school by id', async () => {
      const res = await request(app)
        .get(`/api/schools/${testSchool._id}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Admin School');
    });

    it('should return 404 for non-existent school', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/schools/${fakeId}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('should prevent school admin from accessing other school', async () => {
      const res = await request(app)
        .get(`/api/schools/${otherSchool._id}`)
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/schools', () => {
    it('should create school for superadmin', async () => {
      const res = await request(app)
        .post('/api/schools')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'New Test School',
          address: '456 School St, Edu City, EC 67890, USA',
          contactEmail: 'contact@newschool.com',
          phone: '987-654-3210'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Test School');
    });

    it('should prevent school admin from creating school', async () => {
      const res = await request(app)
        .post('/api/schools')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          name: 'Another Test School'
        });

      expect(res.statusCode).toBe(403);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/schools')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/schools/:id', () => {
    it('should update school', async () => {
      const res = await request(app)
        .put(`/api/schools/${testSchool._id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'Updated School Name'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Updated School Name');
    });

    it('should prevent school admin from updating different school', async () => {
      const res = await request(app)
        .put(`/api/schools/${otherSchool._id}`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          name: 'Hacked School Name'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/schools/:id', () => {
    it('should delete school (superadmin only)', async () => {
      const school = await School.create({
        name: 'Delete Test School',
        address: '789 Delete St',
        contactEmail: 'delete@school.com'
      });

      const res = await request(app)
        .delete(`/api/schools/${school._id}`)
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.statusCode).toBe(204);
    });

    it('should prevent school admin from deleting school', async () => {
      const res = await request(app)
        .delete(`/api/schools/${testSchool._id}`)
        .set('Authorization', `Bearer ${schoolAdminToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});