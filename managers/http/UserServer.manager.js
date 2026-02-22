// const http = require('http');
// const express = require('express');
// const cors = require('cors');
// const path = require('path');

// const RouteRegistry = require('../../libs/RouteRegistry');
// const RouteLoader = require('../../libs/RouteLoader');

// module.exports = class UserServer {
//     constructor({ config, managers, mws }) {
//         console.log('\n' + '='.repeat(50));
//         console.log('🏗️  UserServer Initializing');
//         console.log('='.repeat(50));

//         this.config = config;
//         this.managers = managers || {};
//         this.mws = mws || {};
//         this.app = express();

//         this._validateComponents();
//     }

//     _validateComponents() {
//         const required = ['auth', 'roleCheck', 'rateLimit', 'security'];
//         const missing = required.filter(m => !this.mws[m]);

//         if (missing.length > 0) {
//             console.warn(`⚠️ Missing middleware: ${missing.join(', ')}`);
//         }
//     }

//     run() {
//         const PORT = this.config?.dotEnv?.USER_PORT || 3000;

//         // Setup security middleware FIRST
//         this._setupSecurityMiddleware();

//         // Setup standard middleware
//         this._setupMiddleware();

//         // Create route registry
//         const registry = new RouteRegistry(this.app, this.mws);

//         // Load all routes with rate limiting
//         this._loadRoutes(registry);

//         // Setup debug endpoints
//         this._setupDebugEndpoints(registry);

//         // Setup error handlers
//         this._setupErrorHandlers();

//         // Start server
//         const server = http.createServer(this.app);

//         server.listen(PORT, () => {
//             console.log('\n' + '='.repeat(50));
//             console.log('🚀 Server is running!');
//             console.log('='.repeat(50));
//             console.log(`📍 Port: ${PORT}`);
//             console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
//             console.log(`📍 Security: Enabled`);
//             console.log(`📍 Rate Limiting: Enabled`);
//             console.log(`📍 CORS: Enabled`);
//             console.log(`📍 Debug: http://localhost:${PORT}/api/debug/routes`);
//             console.log('='.repeat(50) + '\n');
//         });

//         return server;
//     }

//     _setupSecurityMiddleware() {
//         console.log('\n🔒 Setting up security middleware...');

//         const security = this.mws?.security;
//         const rateLimit = this.mws?.rateLimit;

//         if (!security) {
//             console.error('❌ Security middleware not found! Available:', Object.keys(this.mws));
//         } else {
//             try {
//                 // Check if security is a function or object
//                 if (typeof security === 'function') {
//                     // It's a function middleware - use it directly
//                     this.app.use(security);
//                     console.log('  ✅ Security function middleware applied');
//                 } else if (typeof security === 'object') {
//                     // It's an object with methods

//                     // Apply Helmet for security headers
//                     if (security.helmet) {
//                         this.app.use(security.helmet);
//                         console.log('  ✅ Helmet applied');
//                     }

//                     // Apply additional security headers
//                     if (security.securityHeaders) {
//                         this.app.use(security.securityHeaders);
//                         console.log('  ✅ Security headers applied');
//                     }

//                     // Prevent NoSQL injection
//                     if (security.sanitize) {
//                         this.app.use(security.sanitize);
//                         console.log('  ✅ NoSQL injection protection applied');
//                     }

//                     // Prevent XSS attacks
//                     if (security.xss) {
//                         this.app.use(security.xss);
//                         console.log('  ✅ XSS protection applied');
//                     }

//                     // Prevent HTTP Parameter Pollution
//                     if (security.hpp) {
//                         this.app.use(security.hpp);
//                         console.log('  ✅ HPP protection applied');
//                     }
//                 }

//                 console.log('✅ Security middleware applied successfully');
//             } catch (error) {
//                 console.error('❌ Error applying security middleware:', error);
//             }
//         }

//         // Apply rate limiting
//         if (!rateLimit) {
//             console.error('❌ Rate limit middleware not found! Available:', Object.keys(this.mws));
//         } else {
//             try {
//                 if (typeof rateLimit === 'function') {
//                     this.app.use('/api', rateLimit);
//                     console.log('  ✅ Rate limiting function applied');
//                 } else if (typeof rateLimit === 'object') {
//                     if (rateLimit.api) {
//                         this.app.use('/api', rateLimit.api);
//                         console.log('  ✅ General rate limiting applied to /api/*');
//                     }
//                 }

//                 console.log('✅ Rate limiting applied successfully');
//             } catch (error) {
//                 console.error('❌ Error applying rate limiting:', error);
//             }
//         }
//     }

//     _setupMiddleware() {
//         // CORS configuration
//         const corsOptions = {
//             origin: process.env.NODE_ENV === 'production'
//                 ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
//                 : '*',
//             methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//             allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
//             exposedHeaders: ['Content-Range', 'X-Content-Range'],
//             credentials: true,
//             maxAge: 86400 // 24 hours
//         };

//         this.app.use(cors(corsOptions));
//         this.app.use(express.json({ limit: '10mb' }));
//         this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
//         this.app.use('/static', express.static('public'));

//         // Request logger (only in development)
//         if (process.env.NODE_ENV !== 'production') {
//             this.app.use((req, res, next) => {
//                 const start = Date.now();

//                 res.on('finish', () => {
//                     const duration = Date.now() - start;
//                     console.log(
//                         `\n📡 ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`
//                     );
//                 });

//                 next();
//             });
//         }

//         // Health check endpoint (public, no rate limit)
//         this.app.get('/health', (req, res) => {
//             res.json({
//                 status: 'healthy',
//                 timestamp: new Date().toISOString(),
//                 uptime: process.uptime(),
//                 environment: process.env.NODE_ENV || 'development'
//             });
//         });

//         console.log('✅ Standard middleware setup complete');
//     }

//     // In UserServer.manager.js - update the test endpoint

//     _loadRoutes(registry) {
//         console.log('\n📂 Loading route files...');

//         const rateLimit = this.mws?.rateLimit;
//         const routeLoader = new RouteLoader(path.join(__dirname, '../../routes'));

//         routeLoader.loadRoutes(registry, this.managers);

//         // FIXED TEST ENDPOINT - Make sure it's defined BEFORE 404 handler
//         this.app.get('/api/test', (req, res) => {
//             console.log('✅ Test endpoint hit successfully');

//             // Get rate limit info from headers if available
//             const rateLimitInfo = {};
//             if (res.getHeader('RateLimit-Limit')) {
//                 rateLimitInfo.limit = res.getHeader('RateLimit-Limit');
//                 rateLimitInfo.remaining = res.getHeader('RateLimit-Remaining');
//                 rateLimitInfo.reset = res.getHeader('RateLimit-Reset');
//             }

//             res.json({
//                 success: true,
//                 message: 'API test endpoint is working',
//                 timestamp: new Date().toISOString(),
//                 rateLimit: rateLimitInfo,
//                 stats: {
//                     managers: Object.keys(this.managers).length,
//                     middleware: Object.keys(this.mws).length,
//                     routes: registry.getRoutes().length
//                 },
//                 environment: process.env.NODE_ENV || 'development'
//             });
//         });

//         // Print all registered routes
//         registry.printRoutes();
//     }

//     // In UserServer.manager.js - update _setupDebugEndpoints method

//     _setupDebugEndpoints(registry) {
//         // Debug endpoints should be protected and only available in development
//         if (process.env.NODE_ENV !== 'production') {
//             const auth = this.mws?.auth;

//             if (!auth) {
//                 console.warn('⚠️ Auth middleware not available for debug endpoints');
//                 return;
//             }

//             // Add this temporarily to your UserServer.manager.js in the _setupDebugEndpoints method

//             this.app.get('/api/debug/verify-token', auth, (req, res) => {
//                 // This endpoint requires a valid token to access
//                 // If you can access it, the token is valid
//                 res.json({
//                     success: true,
//                     message: 'Token is valid!',
//                     user: req.user,
//                     tokenFromHeader: req.headers.authorization?.split(' ')[1]?.substring(0, 20) + '...'
//                 });
//             });

//             this.app.post('/api/debug/decode-token', (req, res) => {
//                 // This endpoint decodes a token WITHOUT verifying (for debugging only)
//                 const { token } = req.body;

//                 if (!token) {
//                     return res.status(400).json({ error: 'Token required' });
//                 }

//                 try {
//                     // Just decode, don't verify
//                     const decoded = jwt.decode(token);

//                     res.json({
//                         success: true,
//                         decoded,
//                         header: jwt.decode(token, { complete: true }).header
//                     });
//                 } catch (error) {
//                     res.status(400).json({ error: error.message });
//                 }
//             });

//             // Protected debug endpoints
//             this.app.get('/api/debug/routes', auth, (req, res) => {
//                 res.json({
//                     success: true,
//                     data: {
//                         totalRoutes: registry.getRoutes().length,
//                         routes: registry.getRoutes(),
//                         managers: Object.keys(this.managers),
//                         middleware: Object.keys(this.mws)
//                     }
//                 });
//             });

//             this.app.get('/api/debug/managers', auth, (req, res) => {
//                 const managerStatus = {};
//                 Object.keys(this.managers).forEach(key => {
//                     const mgr = this.managers[key];
//                     managerStatus[key] = {
//                         exists: true,
//                         type: typeof mgr,
//                         methods: typeof mgr === 'object' ? Object.keys(mgr) : []
//                     };
//                 });

//                 res.json({
//                     success: true,
//                     data: {
//                         totalManagers: Object.keys(this.managers).length,
//                         managers: managerStatus
//                     }
//                 });
//             });

//             this.app.get('/api/debug/middleware', auth, (req, res) => {
//                 const middlewareStatus = {};
//                 Object.keys(this.mws).forEach(key => {
//                     const mw = this.mws[key];
//                     middlewareStatus[key] = {
//                         exists: true,
//                         type: typeof mw,
//                         methods: typeof mw === 'object' ? Object.keys(mw) : []
//                     };
//                 });

//                 res.json({
//                     success: true,
//                     data: {
//                         totalMiddleware: Object.keys(this.mws).length,
//                         middleware: middlewareStatus
//                     }
//                 });
//             });

//             this.app.get('/api/debug/rate-limit-status', auth, (req, res) => {
//                 const rateLimit = this.mws?.rateLimit;
//                 const security = this.mws?.security;

//                 res.json({
//                     success: true,
//                     data: {
//                         rateLimiting: {
//                             exists: !!rateLimit,
//                             type: rateLimit ? typeof rateLimit : null,
//                             methods: rateLimit && typeof rateLimit === 'object' ? Object.keys(rateLimit) : []
//                         },
//                         security: {
//                             exists: !!security,
//                             type: security ? typeof security : null,
//                             methods: security && typeof security === 'object' ? Object.keys(security) : []
//                         },
//                         allMiddleware: Object.keys(this.mws).map(key => ({
//                             name: key,
//                             type: typeof this.mws[key]
//                         }))
//                     }
//                 });
//             });
//         } else {
//             // In production, disable debug endpoints
//             this.app.all('/api/debug/*', (req, res) => {
//                 res.status(404).json({
//                     success: false,
//                     error: 'Debug endpoints are disabled in production'
//                 });
//             });
//         }
//     }

//     _setupErrorHandlers() {
//         // 404 handler
//         this.app.use((req, res) => {
//             console.log(`❌ 404 - Not Found: ${req.method} ${req.url}`);

//             res.status(404).json({
//                 success: false,
//                 error: 'Route not found',
//                 method: req.method,
//                 path: req.url,
//                 timestamp: new Date().toISOString()
//             });
//         });

//         // Global error handler
//         this.app.use((err, req, res, next) => {
//             console.error('❌ Server error:', err);

//             const statusCode = err.statusCode || 500;
//             const message = err.message || 'Internal server error';

//             // Don't expose error details in production
//             const error = process.env.NODE_ENV === 'production'
//                 ? 'Internal server error'
//                 : message;

//             res.status(statusCode).json({
//                 success: false,
//                 error,
//                 ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//             });
//         });

//         console.log('✅ Error handlers setup complete');
//     }
// };

// managers/http/UserServer.manager.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const RouteRegistry = require('../../libs/RouteRegistry');
const RouteLoader = require('../../libs/RouteLoader');

module.exports = class UserServer {
    constructor({ config, managers, mws }) {
        console.log('\n' + '='.repeat(50));
        console.log('🏗️  UserServer Initializing');
        console.log('='.repeat(50));

        this.config = config;
        this.managers = managers || {};
        this.mws = mws || {};
        this.app = express();
        this.server = null;

        this._validateComponents();

        // Setup middleware
        this._setupSecurityMiddleware();
        this._setupMiddleware();

        // Setup routes
        this._setupRoutes();

        // Setup error handlers
        this._setupErrorHandlers();

        console.log('✅ UserServer initialization complete');
    }

    _validateComponents() {
        const required = ['auth', 'roleCheck'];
        const missing = required.filter(m => !this.mws[m]);

        if (missing.length > 0) {
            console.warn(`⚠️ Missing middleware: ${missing.join(', ')}`);
        }
    }

    // Get the configured Express app (for testing and exporting)
    getApp() {
        return this.app;
    }

    // Start the server (only called in development/production)
    start() {
        if (this.server) {
            console.log('⚠️ Server already running');
            return this.server;
        }

        const PORT = this.config?.dotEnv?.USER_PORT || 3000;

        this.server = this.app.listen(PORT, () => {
            console.log(`\n🚀 Server running on port: ${PORT}`);
            console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔍 Test endpoint: http://localhost:${PORT}/api/test`);
        });

        return this.server;
    }

    // Stop the server (for testing)
    stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
            console.log('🛑 Server stopped');
        }
    }

    _setupSecurityMiddleware() {
        console.log('\n🔒 Setting up security middleware...');

        const security = this.mws?.security;
        const rateLimit = this.mws?.rateLimit;

        if (security) {
            try {
                if (typeof security === 'object') {
                    if (security.helmet) this.app.use(security.helmet);
                    if (security.securityHeaders) this.app.use(security.securityHeaders);
                    if (security.sanitize) this.app.use(security.sanitize);
                    if (security.xss) this.app.use(security.xss);
                    if (security.hpp) this.app.use(security.hpp);
                }
                console.log('✅ Security middleware applied');
            } catch (error) {
                console.error('❌ Error applying security middleware:', error);
            }
        }

        // Apply rate limiting (skip in test environment)
        if (rateLimit && process.env.NODE_ENV !== 'test') {
            try {
                if (rateLimit.api) {
                    this.app.use('/api', rateLimit.api);
                    console.log('  ✅ Rate limiting applied');
                }
            } catch (error) {
                console.error('❌ Error applying rate limiting:', error);
            }
        } else if (process.env.NODE_ENV === 'test') {
            console.log('⚠️ Rate limiting skipped in test environment');
        }
    }

    _setupMiddleware() {
        // Basic middleware
        this.app.use(cors({ origin: '*' }));
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging (only in development)
        if (process.env.NODE_ENV === 'development') {
            this.app.use((req, res, next) => {
                console.log(`📡 ${req.method} ${req.url}`);
                next();
            });
        }

        // Health check (always available)
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                env: process.env.NODE_ENV || 'development'
            });
        });

        console.log('✅ Basic middleware setup complete');
    }

    _setupRoutes() {
        console.log('\n📂 Setting up routes...');

        const registry = new RouteRegistry(this.app, this.mws);
        const routeLoader = new RouteLoader(path.join(__dirname, '../../routes'));

        // Load all route files
        routeLoader.loadRoutes(registry, this.managers);

        // Test endpoint
        this.app.get('/api/test', (req, res) => {
            res.json({
                success: true,
                message: 'API test endpoint is working',
                timestamp: new Date().toISOString(),
                env: process.env.NODE_ENV || 'development',
                stats: {
                    managers: Object.keys(this.managers).length,
                    routes: registry.getRoutes().length
                }
            });
        });

        // Add this right after your test endpoint
        this.app.get('/api/debug/registry', (req, res) => {
            try {
                const registry = new RouteRegistry(this.app, this.mws);
                const routeLoader = new RouteLoader(path.join(__dirname, '../../routes'));

                // Check if routes directory exists
                const fs = require('fs');
                const routesDir = path.join(__dirname, '../../routes');
                const routesExist = fs.existsSync(routesDir);

                let files = [];
                if (routesExist) {
                    files = fs.readdirSync(routesDir);
                }

                res.json({
                    success: true,
                    debug: {
                        routesDirectory: {
                            path: routesDir,
                            exists: routesExist,
                            files: files
                        },
                        currentDirectory: __dirname,
                        environment: process.env.NODE_ENV,
                        managers: Object.keys(this.managers),
                        middleware: Object.keys(this.mws),
                        nodeVersion: process.version
                    }
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message,
                    stack: error.stack
                });
            }
        });

        // Debug endpoints (only in development/test)
        if (process.env.NODE_ENV !== 'production') {
            this._setupDebugEndpoints(registry);
        }

        const routes = registry.getRoutes();
        console.log(`✅ Loaded ${routes.length} routes`);

        if (process.env.NODE_ENV === 'development') {
            console.log('\n📋 Registered Routes:');
            routes.forEach(route => {
                console.log(`  ${route.method.toUpperCase().padEnd(6)} ${route.path}`);
            });
        }
    }

    _setupDebugEndpoints(registry) {
        const auth = this.mws?.auth;

        if (auth) {
            this.app.get('/api/debug/routes', auth, (req, res) => {
                res.json({
                    success: true,
                    data: {
                        routes: registry.getRoutes(),
                        managers: Object.keys(this.managers),
                        middleware: Object.keys(this.mws)
                    }
                });
            });

            this.app.get('/api/debug/status', auth, (req, res) => {
                res.json({
                    success: true,
                    data: {
                        environment: process.env.NODE_ENV,
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        managers: Object.keys(this.managers).length,
                        middleware: Object.keys(this.mws).length
                    }
                });
            });
        }
    }

    _setupErrorHandlers() {
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: 'Route not found',
                path: req.url,
                method: req.method
            });
        });

        // Global error handler
        this.app.use((err, req, res, next) => {
            console.error('❌ Server error:', err);

            const statusCode = err.statusCode || 500;
            const message = err.message || 'Internal server error';

            res.status(statusCode).json({
                success: false,
                error: process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            });
        });

        console.log('✅ Error handlers setup complete');
    }
};