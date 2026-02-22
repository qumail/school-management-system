// tests/utils/testHelpers.js
const request = require('supertest');
const mongoose = require('mongoose');

// Helper to make authenticated requests
const authenticatedRequest = (app, token) => {
  const agent = request.agent(app);
  agent.set('Authorization', `Bearer ${token}`);
  return agent;
};

// Helper to create test app (you'll need to export your app)
const getTestApp = () => {
  // You need to export your Express app from your main file
  // This depends on your app structure
  const app = require('../../app'); // Adjust path as needed
  return app;
};

// Helper to validate response structure
const validateApiResponse = (res, expectedStatus = 200) => {
  expect(res.statusCode).toBe(expectedStatus);
  expect(res.body).toHaveProperty('success');
  if (expectedStatus < 400) {
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('data');
  } else {
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty('error');
  }
};

// Helper to create ObjectId
const createObjectId = () => new mongoose.Types.ObjectId();

module.exports = {
  authenticatedRequest,
  getTestApp,
  validateApiResponse,
  createObjectId
};