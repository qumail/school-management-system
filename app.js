// const config                = require('./config/index.config.js');
// const ManagersLoader        = require('./loaders/ManagersLoader.js');

// const mongoDB = config.dotEnv.MONGO_URI? require('./connect/mongo')({
//     uri: config.dotEnv.MONGO_URI
// }):null;



// const managersLoader = new ManagersLoader({ config });
// const managers = managersLoader.load();

// managers.userServer.run();

// Trying something new here

// app.js
const express = require('express');
const config = require('./config/index.config.js');
const ManagersLoader = require('./loaders/ManagersLoader.js');

// Only connect to real DB in non-test environments
if (process.env.NODE_ENV !== 'test' && config.dotEnv.MONGO_URI) {
  require('./connect/mongo')({
    uri: config.dotEnv.MONGO_URI
  });
}

// Create Express app
const app = express();

// Initialize managers and server
const managersLoader = new ManagersLoader({ config });
const managers = managersLoader.load();

// Safely get the configured app
let configuredApp = app; // Fallback to plain app

if (managers && managers.userServer) {
  if (typeof managers.userServer.getApp === 'function') {
    configuredApp = managers.userServer.getApp();
    console.log('✅ Using configured app from UserServer');
  } else if (typeof managers.userServer.init === 'function') {
    // If getApp doesn't exist but init does
    configuredApp = managers.userServer.init();
    console.log('✅ Using initialized app from UserServer');
  } else if (managers.userServer.app) {
    // If the app is directly accessible
    configuredApp = managers.userServer.app;
    console.log('✅ Using app property from UserServer');
  }
} else {
  console.log('⚠️ UserServer not available, using basic app');
}

module.exports = configuredApp;