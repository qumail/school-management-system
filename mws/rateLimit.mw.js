// mws/rateLimit.mw.js
const rateLimit = require('express-rate-limit');

module.exports = (injectable) => {
    const { config } = injectable;
    
    // General API rate limiter
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: {
            success: false,
            error: 'Too many requests from this IP, please try again after 15 minutes'
        },
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        skipSuccessfulRequests: false, // Count all requests
    });

    // Strict rate limiter for auth routes (prevent brute force)
    const authLimiter = rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // Limit each IP to 10 login/register attempts per hour
        message: {
            success: false,
            error: 'Too many authentication attempts, please try again after an hour'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true, // Don't count successful logins
    });

    // Rate limiter for school creation (prevent spam)
    const schoolCreationLimiter = rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5, // Limit each IP to 5 school creations per hour
        message: {
            success: false,
            error: 'Too many school creation attempts, please try again after an hour'
        },
        standardHeaders: true,
        legacyHeaders: false,
    });

    return {
        api: apiLimiter,
        auth: authLimiter,
        schoolCreation: schoolCreationLimiter,
        
        // Custom limiter factory
        createLimiter: (windowMs, max, message) => {
            return rateLimit({
                windowMs,
                max,
                message: {
                    success: false,
                    error: message || 'Too many requests, please try again later'
                },
                standardHeaders: true,
                legacyHeaders: false,
            });
        }
    };
};