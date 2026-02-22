// const MiddlewaresLoader     = require('./MiddlewaresLoader');
// const ApiHandler            = require("../managers/api/Api.manager");
// const LiveDB                = require('../managers/live_db/LiveDb.manager');
// const UserServer            = require('../managers/http/UserServer.manager');
// const ResponseDispatcher    = require('../managers/response_dispatcher/ResponseDispatcher.manager');
// const VirtualStack          = require('../managers/virtual_stack/VirtualStack.manager');
// const ValidatorsLoader      = require('./ValidatorsLoader');
// const ResourceMeshLoader    = require('./ResourceMeshLoader');
// const utils                 = require('../libs/utils');

// const systemArch            = require('../static_arch/main.system');
// const TokenManager          = require('../managers/token/Token.manager');
// const SharkFin              = require('../managers/shark_fin/SharkFin.manager');
// const TimeMachine           = require('../managers/time_machine/TimeMachine.manager');

// const MongoLoader = require('./MongoLoader');
// const EntitiesLoader = require('./EntitiesLoader');

// module.exports = class ManagersLoader {
//     constructor({ config }) {
//         this.managers   = {};
//         this.config     = config;

//         this._preload();
//         this.injectable = {
//             utils,
//             config,
//             managers: this.managers, 
//             validators: this.validators,
//             mongomodels: this.mongomodels,
//             resourceNodes: this.resourceNodes,
//         };
//     }

//     _preload(){
//         const validatorsLoader    = new ValidatorsLoader({
//             models: require('../managers/_common/schema.models'),
//             customValidators: require('../managers/_common/schema.validators'),
//         });
//         const resourceMeshLoader  = new ResourceMeshLoader({})
//         const mongoLoader      = new MongoLoader({ schemaExtension: "mongoModel.js" });

//         this.validators           = validatorsLoader.load();
//         this.resourceNodes        = resourceMeshLoader.load();
//         this.mongomodels          = mongoLoader.load();
//     }

//     load() {
//         // core managers
//         this.managers.responseDispatcher = new ResponseDispatcher();
//         this.managers.token = new TokenManager(this.injectable);

//         // LOAD ENTITY MANAGERS (auth.manager.js, etc.)
//         console.log("\n📚 Loading entity managers...");
//         const entitiesLoader = new EntitiesLoader({ injectable: this.injectable });
//         const entityManagers = entitiesLoader.load();
//         Object.assign(this.managers, entityManagers);

//         // Update injectable with loaded managers
//         this.injectable.managers = this.managers;

//         // Load middlewares
//         console.log("\n🔧 Loading middlewares...");
//         const middlewaresLoader = new MiddlewaresLoader(this.injectable);
//         const mwsRepo = middlewaresLoader.load();
//         this.injectable.mwsRepo = mwsRepo;

//         this.managers.mwsExec = new VirtualStack({ preStack:['__device'], ...this.injectable });

//         // API Handler
//         this.managers.userApi = new ApiHandler({
//             ...this.injectable,
//             managers: this.managers,
//             prop:'httpExposed'
//         });

//         // HTTP Server (class-based)
//         console.log("\n🚀 Initializing HTTP server...");
//         this.managers.userServer = new UserServer({ 
//             config: this.config, 
//             managers: this.managers,
//             mws: mwsRepo
//         });

//         console.log("\n✅ All Managers Loaded:", Object.keys(this.managers));
//         console.log("✅ Middleware Loaded:", Object.keys(mwsRepo));

//         return this.managers;
//     }
// };

// loaders/ManagersLoader.js older version
// const MiddlewaresLoader = require('./MiddlewaresLoader');
// const ApiHandler = require("../managers/api/Api.manager");
// const RestApiHandler = require("../managers/api/RestApiHandler.manager");
// const UserServer = require('../managers/http/UserServer.manager');
// const ResponseDispatcher = require('../managers/response_dispatcher/ResponseDispatcher.manager');
// const VirtualStack = require('../managers/virtual_stack/VirtualStack.manager');
// const ValidatorsLoader = require('./ValidatorsLoader');
// const ResourceMeshLoader = require('./ResourceMeshLoader');
// const utils = require('../libs/utils');
// const TokenManager = require('../managers/token/Token.manager');
// const MongoLoader = require('./MongoLoader');
// const EntitiesLoader = require('./EntitiesLoader');

// module.exports = class ManagersLoader {
//     constructor({ config }) {
//         this.managers = {};
//         this.config = config;
//         this.mongomodels = {}; // Initialize empty

//       //  this._preload();
//         // this.injectable = {
//         //     utils,
//         //     config,
//         //     managers: this.managers,
//         //     validators: this.validators,
//         //   //  mongomodels: this.mongomodels,
//         //     resourceNodes: this.resourceNodes,
//         // };
//     }

//     _preload() {
//            // Load Mongo models FIRST
//         console.log('\n📦 Loading Mongo models...');
//         const mongoLoader = new MongoLoader({ schemaExtension: "mongoModel.js" });
//         this.mongomodels = mongoLoader.load();
//         console.log('✅ Mongo models loaded:', Object.keys(this.mongomodels));

//         const validatorsLoader = new ValidatorsLoader({
//             models: require('../managers/_common/schema.models'),
//             customValidators: require('../managers/_common/schema.validators'),
//         });
//         const resourceMeshLoader = new ResourceMeshLoader({})
//         // const mongoLoader = new MongoLoader({ schemaExtension: "mongoModel.js" });

//         this.validators = validatorsLoader.load();
//         this.resourceNodes = resourceMeshLoader.load();
//        // this.mongomodels = mongoLoader.load();
//     }

//     // In loaders/ManagersLoader.js, update the load() method:

//     // load() {
//     //     console.log('\n' + '='.repeat(50));
//     //     console.log('📦 Loading Managers');
//     //     console.log('='.repeat(50));

//     //     // Core managers
//     //     this.managers.responseDispatcher = new ResponseDispatcher();
//     //     this.managers.token = new TokenManager(this.injectable);

//     //     // Load entity managers (Auth, School, Classroom, Student)
//     //     console.log('\n📚 Loading entity managers...');
//     //     const entitiesLoader = new EntitiesLoader({ injectable: this.injectable });
//     //     const entityManagers = entitiesLoader.load();
//     //     Object.assign(this.managers, entityManagers);

//     //     // Update injectable with loaded managers
//     //     this.injectable.managers = this.managers;

//     //     // Load middlewares (including new security middleware)
//     //     console.log('\n🔧 Loading middlewares...');
//     //     const middlewaresLoader = new MiddlewaresLoader(this.injectable);
//     //     const mwsRepo = middlewaresLoader.load();
//     //     this.injectable.mwsRepo = mwsRepo;

//     //     // Check if rate limiting and security middleware are loaded
//     //     if (!mwsRepo.rateLimit) {
//     //         console.warn('⚠️ Rate limiting middleware not loaded!');
//     //     }
//     //     if (!mwsRepo.security) {
//     //         console.warn('⚠️ Security middleware not loaded!');
//     //     }

//     //     // Virtual stack for middleware execution
//     //     this.managers.mwsExec = new VirtualStack({
//     //         preStack: ['__device'],
//     //         ...this.injectable
//     //     });

//     //     // RPC API Handler (keep for backward compatibility)
//     //     this.managers.userApi = new ApiHandler({
//     //         ...this.injectable,
//     //         managers: this.managers,
//     //         prop: 'httpExposed'
//     //     });

//     //     // REST API Handler
//     //     console.log('\n🔄 Initializing REST API Handler...');
//     //     this.managers.restApiHandler = new RestApiHandler({
//     //         config: this.config,
//     //         managers: this.managers,
//     //         mwsRepo: mwsRepo
//     //     });

//     //     // HTTP Server
//     //     console.log('\n🚀 Initializing HTTP Server...');
//     //     this.managers.userServer = new UserServer({
//     //         config: this.config,
//     //         managers: this.managers,
//     //         mws: mwsRepo
//     //     });

//     //     console.log('\n' + '='.repeat(50));
//     //     console.log('✅ All Managers Loaded Successfully');
//     //     console.log('='.repeat(50));
//     //     console.log(`📊 Total Managers: ${Object.keys(this.managers).length}`);
//     //     console.log(`📊 Total Middleware: ${Object.keys(mwsRepo).length}`);
//     //     console.log(`📊 Security: ${mwsRepo.security ? '✅' : '❌'}`);
//     //     console.log(`📊 Rate Limiting: ${mwsRepo.rateLimit ? '✅' : '❌'}`);
//     //     console.log('='.repeat(50) + '\n');

//     //     return this.managers;
//     // }

//     // In loaders/ManagersLoader.js, update the load method: New change

//     load() {
//         console.log('\n' + '='.repeat(50));
//         console.log('📦 Loading Managers');
//         console.log('='.repeat(50));

//          // Load all pre-requisites FIRST
//         this._preload();

//         // Core managers
//         this.managers.responseDispatcher = new ResponseDispatcher();
//         this.managers.token = new TokenManager(this.injectable);


//         // Update injectable
//         // this.injectable.managers = this.managers;
//           // CRITICAL: Create injectable WITH models BEFORE loading entity managers
//         this.injectable = {
//             utils,
//             config: this.config,
//             managers: this.managers,
//             validators: this.validators,
//             mongomodels: this.mongomodels, // MODELS ARE HERE!
//             resourceNodes: this.resourceNodes,
//         };

//         console.log('1. injectable.mongomodels keys:', Object.keys(this.injectable.mongomodels));

//             // Load entity managers
//         console.log('\n📚 Loading entity managers...');
//         const entitiesLoader = new EntitiesLoader({ injectable: this.injectable });
//         const entityManagers = entitiesLoader.load();
//         Object.assign(this.managers, entityManagers);

//         // Update injectable with loaded managers
//         this.injectable.managers = this.managers;

//         // Load middlewares
//         console.log('\n🔧 Loading middlewares...');
//         const middlewaresLoader = new MiddlewaresLoader(this.injectable);
//         const mwsRepo = middlewaresLoader.load();
//         this.injectable.mwsRepo = mwsRepo;

//         // Virtual stack
//         this.managers.mwsExec = new VirtualStack({
//             preStack: ['__device'],
//             ...this.injectable
//         });

//         // API Handlers
//         this.managers.userApi = new ApiHandler({
//             ...this.injectable,
//             managers: this.managers,
//             prop: 'httpExposed'
//         });

//         this.managers.restApiHandler = new RestApiHandler({
//             config: this.config,
//             managers: this.managers,
//             mwsRepo: mwsRepo
//         });

//         // Create HTTP Server (configures routes but doesn't start listening)
//         console.log('\n🚀 Creating HTTP Server...');
//         this.managers.userServer = new UserServer({
//             config: this.config,
//             managers: this.managers,
//             mws: mwsRepo
//         });

//         console.log('\n✅ All Managers Loaded Successfully');
//         console.log(`📊 Total Managers: ${Object.keys(this.managers).length}`);

//         return this.managers;
//     }
// };

// new version
// loaders/ManagersLoader.js
const MiddlewaresLoader = require('./MiddlewaresLoader');
const ApiHandler = require("../managers/api/Api.manager");
const UserServer = require('../managers/http/UserServer.manager');
const ResponseDispatcher = require('../managers/response_dispatcher/ResponseDispatcher.manager');
const VirtualStack = require('../managers/virtual_stack/VirtualStack.manager');
const ValidatorsLoader = require('./ValidatorsLoader');
const ResourceMeshLoader = require('./ResourceMeshLoader');
const utils = require('../libs/utils');
const TokenManager = require('../managers/token/Token.manager');
const MongoLoader = require('./MongoLoader');
const EntitiesLoader = require('./EntitiesLoader');

module.exports = class ManagersLoader {
    constructor({ config }) {
        this.managers = {};
        this.config = config;
        this.mongomodels = {};
        this.validators = {};
        this.resourceNodes = {};
    }

    _preload() {
        console.log('\n📦 Preloading Mongo models...');
        // Load Mongo models FIRST
        const mongoLoader = new MongoLoader({ schemaExtension: "mongoModel.js" });
        this.mongomodels = mongoLoader.load();
        console.log('✅ Mongo models loaded:', Object.keys(this.mongomodels));

        // Load validators and resource nodes
        const validatorsLoader = new ValidatorsLoader({
            models: this.mongomodels,
            customValidators: require('../managers/_common/schema.validators'),
        });
        const resourceMeshLoader = new ResourceMeshLoader({});

        this.validators = validatorsLoader.load();
        this.resourceNodes = resourceMeshLoader.load();
    }

    load() {
        console.log('\n' + '='.repeat(60));
        console.log('📦 MANAGERS LOADER STARTING');
        console.log('='.repeat(60));
        
        // Load all pre-requisites FIRST
        this._preload();

        // CRITICAL: Create base injectable with all dependencies
        const baseInjectable = {
            utils,
            config: this.config,
            validators: this.validators,
            mongomodels: this.mongomodels,
            resourceNodes: this.resourceNodes,
            managers: this.managers // This will be populated as we go
        };

        console.log('1. baseInjectable.mongomodels keys:', Object.keys(baseInjectable.mongomodels));
        console.log('2. baseInjectable.config exists:', !!baseInjectable.config);

        // Core managers (these need the base injectable)
        console.log('\n3. Loading core managers...');
        this.managers.responseDispatcher = new ResponseDispatcher();
        
        // TokenManager needs config from baseInjectable
        this.managers.token = new TokenManager(baseInjectable);
        console.log('   ✅ TokenManager loaded');

        // Update injectable with loaded core managers
        baseInjectable.managers = this.managers;

        // Load entity managers - they need the updated injectable
        console.log('\n4. Loading entity managers...');
        const entitiesLoader = new EntitiesLoader({ injectable: baseInjectable });
        const entityManagers = entitiesLoader.load();
        Object.assign(this.managers, entityManagers);

        // Update injectable with all managers
        baseInjectable.managers = this.managers;

        // Load middlewares
        console.log('\n5. Loading middlewares...');
        const middlewaresLoader = new MiddlewaresLoader(baseInjectable);
        const mwsRepo = middlewaresLoader.load();
        baseInjectable.mwsRepo = mwsRepo;

        this.managers.mwsExec = new VirtualStack({ 
            preStack: ['__device'], 
            ...baseInjectable 
        });

        this.managers.userApi = new ApiHandler({
            ...baseInjectable,
            managers: this.managers,
            prop: 'httpExposed'
        });

        this.managers.userServer = new UserServer({ 
            config: this.config, 
            managers: this.managers,
            mws: mwsRepo
        });

        console.log('\n6. Final managers loaded:', Object.keys(this.managers));
        console.log('='.repeat(60) + '\n');

        return this.managers;
    }
};