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