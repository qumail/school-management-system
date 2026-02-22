// tests/setup/mongooseSetup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import your actual models
const UserModel = require('../../managers/entities/auth/auth.mongoModel');
const SchoolModel = require('../../managers/entities/school/school.mongoModel');
const ClassroomModel = require('../../managers/entities/classroom/classroom.mongoModel');
const StudentModel = require('../../managers/entities/student/student.mongoModel');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
  
  // Register models explicitly
  mongoose.model('User', UserModel.schema);
  mongoose.model('School', SchoolModel.schema);
  mongoose.model('Classroom', ClassroomModel.schema);
  mongoose.model('Student', StudentModel.schema);
  
  console.log('✅ Test database connected and models registered');
});

// Clear all data between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

// Close connection after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('✅ Test database disconnected');
});

// Export models for use in tests
module.exports = {
  User: mongoose.model('User'),
  School: mongoose.model('School'),
  Classroom: mongoose.model('Classroom'),
  Student: mongoose.model('Student')
};