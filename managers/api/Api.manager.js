const getParamNames = require('./_common/getParamNames');
/** 
 * scans all managers for exposed methods 
 * and makes them available through a handler middleware
 */

module.exports = class ApiHandler {

    /**
     * @param {object} containing instance of all managers
     * @param {string} prop with key to scan for exposed methods
     */

    constructor({ config, cortex, cache, managers, mwsRepo, prop }) {
        this.config = config;
        this.cache = cache;
        this.cortex = cortex;
        this.managers = managers;
        this.mwsRepo = mwsRepo;
        this.mwsExec = this.managers.mwsExec;
        this.prop = prop
        this.exposed = {};
        this.methodMatrix = {};
        this.auth = {};
        this.fileUpload = {};
        this.mwsStack = {};
        this.mw = this.mw.bind(this);

        /** filter only the modules that have interceptors */
        // console.log(`# Http API`);
        Object.keys(this.managers).forEach(mk => {
            if (this.managers[mk][this.prop]) {
                // console.log('managers - mk ', this.managers[mk])
                this.methodMatrix[mk] = {};
                // console.log(`## ${mk}`);
                this.managers[mk][this.prop].forEach(i => {
                    /** creating the method matrix */
                    let method = 'post';
                    let fnName = i;
                    if (i.includes("=")) {
                        let frags = i.split('=');
                        method = frags[0];
                        fnName = frags[1];
                    }
                    if (!this.methodMatrix[mk][method]) {
                        this.methodMatrix[mk][method] = [];
                    }
                    this.methodMatrix[mk][method].push(fnName);

                    //console.log(this.managers[mk][fnName], 'func')
                    let params = getParamNames(this.managers[mk][fnName], fnName, mk);
                    //console.log(params, 'Params')
                    params = params.split(',').map(i => {
                        i = i.trim();
                        i = i.replace('{', '');
                        i = i.replace('}', '');
                        return i;
                    })
                    /** building middlewares stack */


                    params.forEach(param => {
                        if (!this.mwsStack[`${mk}.${fnName}`]) {
                            this.mwsStack[`${mk}.${fnName}`] = [];
                        }
                        //console.log(params, 'Params')
                        if (param.startsWith('__')) {
                            // this is a middleware identifier 
                            // mws are executed in the same order they existed
                            /** check if middleware exists */
                            // console.log(this.mwsRepo);
                            if (!this.mwsRepo[param]) {
                                console.log(this.mwsRepo, 'MWSRePO')
                                throw Error(`Unable to find middleware ${param}`)
                            } else {
                                this.mwsStack[`${mk}.${fnName}`].push(param);
                            }
                        }
                    })

                    // console.log(`* ${i} :`, 'args=', params);

                });
            }
        });

        /** expose apis through cortex */
        Object.keys(this.managers).forEach(mk => {
            if (this.managers[mk].interceptor) {
                this.exposed[mk] = this.managers[mk];
                // console.log(`## ${mk}`);
                if (this.exposed[mk].cortexExposed) {
                    this.exposed[mk].cortexExposed.forEach(i => {
                        // console.log(`* ${i} :`,getParamNames(this.exposed[mk][i]));
                    })
                }
            }
        });

    }


    async _exec({ targetModule, fnName, cb, data }) {
        let result = {};

        try {
            result = await targetModule[`${fnName}`](data);
        } catch (err) {
            console.log(`error`, err);
            result.error = `${fnName} failed to execute`;
        }

        if (cb) cb(result);
        return result;
    }
    
    /** a middleware for executing APIs through HTTP (REST compatible) */
    async mw(req, res, next) {

        let method = req.method.toLowerCase();

        /** 🔥 REST-injected values */
        let moduleName = req.moduleName || req.params?.moduleName;
        let fnName = req.fnName || req.params?.fnName;

        if (!moduleName || !fnName) {
            return this.managers.responseDispatcher.dispatch(res, {
                ok: false,
                message: 'Invalid route resolution'
            });
        }

        let moduleMatrix = this.methodMatrix[moduleName];

        /** validate module */
        if (!moduleMatrix) {
            return this.managers.responseDispatcher.dispatch(res, {
                ok: false,
                message: `module ${moduleName} not found`
            });
        }

        /** validate method */
        if (!moduleMatrix[method]) {
            return this.managers.responseDispatcher.dispatch(res, {
                ok: false,
                message: `unsupported method ${method} for ${moduleName}`
            });
        }

        /** validate function */
        if (!moduleMatrix[method].includes(fnName)) {
            return this.managers.responseDispatcher.dispatch(res, {
                ok: false,
                message: `unable to find function ${fnName} with method ${method}`
            });
        }

        /** middleware stack */
        let targetStack = this.mwsStack[`${moduleName}.${fnName}`] || [];

        let hotBolt = this.mwsExec.createBolt({
            mwsRepo: this.mwsRepo,
            managers: this.managers,
            stack: targetStack,
            req,
            res,
            onDone: async ({ req, res, results }) => {

                /** 🔥 Proper REST body merging */
                let body = {
                    ...(req.method === 'GET' ? req.query : req.body),
                    ...req.params,
                };

                let result = await this._exec({
                    targetModule: this.managers[moduleName],
                    fnName,
                    data: {
                        ...body,
                        ...results,
                        res,
                    }
                });

                if (!result) result = {};

                if (result.selfHandleResponse) {
                    return;
                }

                if (result.errors) {
                    return this.managers.responseDispatcher.dispatch(res, {
                        ok: false,
                        errors: result.errors
                    });
                }

                if (result.error) {
                    return this.managers.responseDispatcher.dispatch(res, {
                        ok: false,
                        message: result.error
                    });
                }

                return this.managers.responseDispatcher.dispatch(res, {
                    ok: true,
                    data: result
                });
            }
        });

        await hotBolt.run();
    }

}