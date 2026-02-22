const jwt = require('jsonwebtoken');

module.exports = (injectable) => {
    const { config } = injectable || {};
    const JWT_SECRET = config?.dotEnv?.JWT_SECRET || process.env.JWT_SECRET;
    const JWT_ISSUER = config?.dotEnv?.JWT_ISSUER || 'school-management-system';
    const JWT_AUDIENCE = config?.dotEnv?.JWT_AUDIENCE || 'school-api';

    if (!JWT_SECRET) {
        console.error('❌ JWT_SECRET is not configured!');
    }

    // Token blacklist (in production, use Redis)
    const tokenBlacklist = new Set();

    return (req, res, next) => {
        try {
            // Get token from Authorization header
            const authHeader = req.headers.authorization;
            
            if (!authHeader) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required. No authorization header provided.'
                });
            }

            // Check if it's Bearer token
            if (!authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid authorization format. Use Bearer token.'
                });
            }

            const token = authHeader.split(' ')[1];
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required. Token missing.'
                });
            }

            // Check if token is blacklisted
            if (tokenBlacklist.has(token)) {
                return res.status(401).json({
                    success: false,
                    error: 'Token has been revoked. Please login again.'
                });
            }

            // Verify token with additional options
            const decoded = jwt.verify(token, JWT_SECRET);

            // Check token type (if you have refresh tokens vs access tokens)
            if (decoded.type && decoded.type !== 'access') {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token type. Access token required.'
                });
            }

            // Attach user to request
            req.user = {
                id: decoded.userId || decoded.id,
                userId: decoded.userId || decoded.id,
                email: decoded.email,
                role: decoded.role,
                schoolId: decoded.schoolId,
                permissions: decoded.permissions || []
            };

            next();
        } catch (error) {
            console.error('Auth middleware error:', error.message);

            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token'
                });
            }

            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expired',
                    expiredAt: error.expiredAt
                });
            }

            return res.status(500).json({
                success: false,
                error: 'Authentication failed'
            });
        }
    };
};