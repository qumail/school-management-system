// const config                = require('./config/index.config.js');
// const ManagersLoader        = require('./loaders/ManagersLoader.js');


// process.on('uncaughtException', err => {
//     console.log(`Uncaught Exception:`)
//     console.log(err, err.stack);

//     process.exit(1)
// })

// process.on('unhandledRejection', (reason, promise) => {
//     console.log('Unhandled rejection at ', promise, `reason:`, reason);
//     process.exit(1)
// });

// config.dotEnv.MONGO_URI? require('./connect/mongo')({
//     uri: config.dotEnv.MONGO_URI
// }):null;

// const managersLoader = new ManagersLoader({config});
// const managers = managersLoader.load();

// managers.userServer.run();

// Trying something extraordinary
const app = require('./app');

// The app is already fully configured
// Just need to start the server
const PORT = process.env.PORT || 3000;

// The app already has all routes configured
const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port: ${PORT}`);
    console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔍 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

module.exports = server; // For testing if needed