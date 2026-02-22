// mws/security.mw.js
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

module.exports = (injectable) => {
    console.log('🔧 Initializing security middleware...');
    
    const { config } = injectable;

    const helmetConfig = process.env.NODE_ENV === 'production' 
        ? {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }
        : {
            contentSecurityPolicy: false,
        };

    // Create the security object
    const security = {
        helmet: helmet(helmetConfig),
        sanitize: mongoSanitize({
            replaceWith: '_',
            onSanitize: ({ req, key }) => {
                console.warn(`NoSQL injection attempt detected on ${key}`);
            },
        }),
        xss: xss(),
        hpp: hpp({
            checkBody: true,
            checkQuery: true,
            checkParams: true,
            whitelist: ['sort', 'fields', 'page', 'limit']
        }),
        securityHeaders: (req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
            next();
        }
    };

    console.log('✅ security middleware initialized');

    // Return a function that can be used as middleware
    // This satisfies the MiddlewaresLoader expectation
    return (req, res, next) => {
        // This is a catch-all middleware that applies all security measures
        // But since we want to apply them individually in UserServer,
        // we'll attach the security object to req for later use
        req.security = security;
        next();
    };
};