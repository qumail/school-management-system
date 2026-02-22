// managers/api/RestApiHandler.manager.js
/**
 * REST API Handler - Manages RESTful route execution with middleware stack
 */
module.exports = class RestApiHandler {
    constructor({ config, managers, mwsRepo }) {
        this.config = config;
        this.managers = managers;
        this.mwsRepo = mwsRepo;
        this.mwsExec = managers.mwsExec;
        this.responseDispatcher = managers.responseDispatcher;
        
        console.log('🔄 REST API Handler initialized');
    }

    /**
     * Create middleware stack executor for a route
     */
    createMiddlewareExecutor(middlewareStack, req, res) {
        return new Promise((resolve, reject) => {
            const hotBolt = this.mwsExec.createBolt({
                mwsRepo: this.mwsRepo,
                managers: this.managers,
                stack: middlewareStack,
                req,
                res,
                onDone: async ({ req, res, results }) => {
                    resolve({ req, res, results });
                },
                onError: (error) => {
                    reject(error);
                }
            });

            hotBolt.run().catch(reject);
        });
    }

    /**
     * Send standardized response
     */
    sendResponse(res, data, statusCode = 200) {
        if (this.responseDispatcher) {
            return this.responseDispatcher.dispatch(res, {
                statusCode,
                ok: true,
                data
            });
        }

        return res.status(statusCode).json({
            success: true,
            data
        });
    }

    /**
     * Send error response
     */
    sendError(res, error, statusCode = 500) {
        const errorMessage = error.message || 'Internal server error';
        
        if (this.responseDispatcher) {
            return this.responseDispatcher.dispatch(res, {
                statusCode,
                ok: false,
                message: errorMessage
            });
        }

        return res.status(statusCode).json({
            success: false,
            error: errorMessage
        });
    }

    /**
     * Handle file upload middleware
     */
    handleFileUpload(req, res, next) {
        // This would integrate with multer or similar
        // For now, pass through
        next();
    }
};