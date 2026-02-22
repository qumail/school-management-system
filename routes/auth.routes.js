// routes/auth.routes.js
/**
 * Authentication Routes
 */
module.exports = (registry, managers) => {
    // Safely access auth manager with null check
    const auth = managers?.Auth || managers?.auth;
    
    if (!auth) {
        console.warn('⚠️ Auth manager not found, skipping auth routes');
        console.log('   Available managers:', Object.keys(managers || {}).join(', '));
        return;
    }

    console.log('📝 Registering auth routes...');
    console.log('   Auth manager methods:', Object.keys(auth).join(', '));

    // Public routes (no authentication required)
    if (auth.register) {
        registry.public('post', '/api/auth/register', auth.register);
    }

    if (auth.login) {
        registry.public('post', '/api/auth/login', auth.login);
    }

    if (auth.refreshToken) {
        registry.public('post', '/api/auth/refresh-token', auth.refreshToken);
    }

    // Protected routes (authentication required)
    if (auth.getCurrentUser) {
        registry.protected('get', '/api/auth/me', auth.getCurrentUser);
    }

    if (auth.logout) {
        registry.protected('post', '/api/auth/logout', auth.logout);
    }

    if (auth.changePassword) {
        registry.protected('post', '/api/auth/change-password', auth.changePassword);
    }

    // Password reset routes (if implemented)
    if (auth.forgotPassword) {
        registry.public('post', '/api/auth/forgot-password', auth.forgotPassword);
    }

    if (auth.resetPassword) {
        registry.public('post', '/api/auth/reset-password', auth.resetPassword);
    }

    console.log('✅ Auth routes registered successfully');
};