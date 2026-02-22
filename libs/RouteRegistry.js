/**
 * Route Registry - Manages route registration and provides a clean API for defining routes
 */
module.exports = class RouteRegistry {
    constructor(app, middleware = {}) {
        this.app = app;
        this.middleware = middleware;
        this.routes = [];
        this.debugMode = process.env.NODE_ENV !== 'production';
    }

    /**
     * Register a public route (no authentication required)
     */
    public(method, path, handler) {
        this._registerRoute(method, path, handler, {
            type: 'public',
            middleware: []
        });
        return this;
    }

    /**
     * Register a protected route (authentication required)
     */
    protected(method, path, handler, roles = []) {
        const middleware = [this.middleware.auth];

        if (roles.length > 0 && this.middleware.roleCheck) {
            middleware.push(this.middleware.roleCheck(roles));
        }

        this._registerRoute(method, path, handler, {
            type: 'protected',
            roles,
            middleware
        });
        return this;
    }

    /**
     * Register a route with custom middleware
     */
    custom(method, path, handler, customMiddleware = []) {
        this._registerRoute(method, path, handler, {
            type: 'custom',
            middleware: customMiddleware
        });
        return this;
    }

    /**
     * Register RESTful resource routes
     */
    resource(basePath, controller, options = {}) {
        const { except = [], only = null, additional = [] } = options;

        // Default CRUD actions
        const actions = {
            index: { method: 'get', path: basePath, roles: ['superadmin', 'school_admin'] },
            show: { method: 'get', path: `${basePath}/:id`, roles: ['superadmin', 'school_admin'] },
            store: { method: 'post', path: basePath, roles: ['superadmin', 'school_admin'] },
            update: { method: 'put', path: `${basePath}/:id`, roles: ['superadmin', 'school_admin'] },
            destroy: { method: 'delete', path: `${basePath}/:id`, roles: ['superadmin'] }
        };

        // Determine which actions to register
        const actionsToRegister = only
            ? Object.keys(actions).filter(key => only.includes(key))
            : Object.keys(actions).filter(key => !except.includes(key));

        // Register CRUD actions
        actionsToRegister.forEach(action => {
            const route = actions[action];
            if (route && controller[action]) {
                this.protected(route.method, route.path, controller[action], route.roles);
            }
        });

        // Register additional custom actions
        additional.forEach(route => {
            const { method, path, handler, roles = [] } = route;
            const fullPath = path.startsWith('/') ? path : `${basePath}${path}`;
            this.protected(method, fullPath, controller[handler], roles);
        });

        return this;
    }

    /**
     * Register nested resource routes
     */
    nestedResource(parentPath, resourceName, controller, options = {}) {
        const basePath = `${parentPath}/:parentId/${resourceName}`;
        return this.resource(basePath, controller, options);
    }

    /**
     * Get all registered routes (for debugging)
     */
    getRoutes() {
        return this.routes.map(route => ({
            method: route.method.toUpperCase(),
            path: route.path,
            type: route.type,
            roles: route.roles || [],
            hasHandler: !!route.handler
        }));
    }

    /**
     * Print all routes to console (for debugging)
     */
    printRoutes() {
        console.log('\n📋 Registered Routes:');
        console.log('═══════════════════════════════════════');

        const grouped = this.routes.reduce((acc, route) => {
            if (!acc[route.type]) acc[route.type] = [];
            acc[route.type].push(route);
            return acc;
        }, {});

        Object.keys(grouped).forEach(type => {
            console.log(`\n${type.toUpperCase()} Routes:`);
            grouped[type].forEach(route => {
                const method = route.method.toUpperCase().padEnd(6);
                const roles = route.roles?.length ? ` [${route.roles.join(', ')}]` : '';
                console.log(`  ${method} ${route.path}${roles}`);
            });
        });
        console.log('\n═══════════════════════════════════════\n');
    }

    // In libs/RouteRegistry.js, update _registerRoute method:

    _registerRoute(method, path, handler, options) {
        // Safety check - if handler is undefined, log error and skip
        if (!handler) {
            console.error(`❌ Cannot register route ${method.toUpperCase()} ${path}: Handler is undefined`);
            return;
        }

        if (typeof handler !== 'function') {
            console.error(`❌ Cannot register route ${method.toUpperCase()} ${path}: Handler is not a function`);
            return;
        }

        const { type, roles = [], middleware = [] } = options;

        // Create the route handler
        const routeHandler = this._createRouteHandler(handler);

        // Register with Express
        this.app[method](path, ...middleware, routeHandler);

        // Store route info
        this.routes.push({
            method,
            path,
            type,
            roles,
            handler: handler.name || 'anonymous',
            middleware: middleware.length
        });

        if (this.debugMode) {
            console.log(`✅ Registered: ${method.toUpperCase()} ${path} [${type}]`);
        }
    }

    // In libs/RouteRegistry.js - update the error handling in _createRouteHandler
    // libs/RouteRegistry.js - Update error handling in _createRouteHandler

    _createRouteHandler(handler) {
        return async (req, res, next) => {
            try {
                // Build request data object
                const requestData = {
                    ...req.query,
                    ...req.body,
                    ...req.params,
                    ...req.routeParams,
                    user: req.user,
                    file: req.file,
                    files: req.files,
                    headers: req.headers,
                    ip: req.ip,
                    method: req.method,
                    path: req.path
                };

                // Call the handler
                const result = await handler(requestData, res);

                // If handler already sent response, don't send again
                if (res.headersSent) {
                    return;
                }

                // Auto-determine status code
                let statusCode = 200;
                if (req.method === 'POST') statusCode = 201;

                // Handle DELETE method
                if (req.method === 'DELETE') {
                    if (result === undefined || result === null) {
                        return res.status(204).send();
                    }
                }

                // Send response
                res.status(statusCode).json({
                    success: true,
                    data: result
                });

            } catch (error) {
                console.error('❌ Route handler error:', error);

                // Determine status code from error
                const statusCode = error.statusCode || 500;
                const message = error.message || 'Internal server error';

                // Send error response with appropriate status code
                res.status(statusCode).json({
                    success: false,
                    error: message
                });
            }
        };
    }
};