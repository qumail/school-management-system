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

// ✅ Import specific managers
const AuthManager = require('../managers/entities/auth/Auth.manager');
const SchoolManager = require('../managers/entities/school/School.manager');
const ClassroomManager = require('../managers/entities/classroom/Classroom.manager');
const StudentManager = require('../managers/entities/student/Student.manager');

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
        console.log('\n4. Loading entity managers from EntitiesLoader...');
        const entitiesLoader = new EntitiesLoader({ injectable: baseInjectable });
        const entityManagers = entitiesLoader.load();

        // Log what entityManagers contains
        console.log('   📍 Entity managers loaded:', Object.keys(entityManagers));

        // Assign entity managers
        Object.assign(this.managers, entityManagers);

        // ✅ ADD SPECIFIC MANAGERS IF THEY WEREN'T LOADED BY ENTITIESLOADER
        console.log('\n4b. Ensuring all required managers are present...');

       // Check and create AuthManager if missing
        if (!this.managers.auth) {
            console.log('   ⚠️ AuthManager not found, creating manually...');
            this.managers.auth = AuthManager(baseInjectable);
            console.log('   ✅ AuthManager created');
        }

        // Check and create SchoolManager if missing
        if (!this.managers.school) {
            console.log('   ⚠️ SchoolManager not found, creating manually...');
            this.managers.school =  SchoolManager(baseInjectable);
            console.log('   ✅ SchoolManager created');
        }

        // Check and create ClassroomManager if missing
        if (!this.managers.classroom) {
            console.log('   ⚠️ ClassroomManager not found, creating manually...');
            this.managers.classroom =  ClassroomManager(baseInjectable);
            console.log('   ✅ ClassroomManager created');
        }

        // Check and create StudentManager if missing
        if (!this.managers.student) {
            console.log('   ⚠️ StudentManager not found, creating manually...');
            this.managers.student =  StudentManager(baseInjectable);
            console.log('   ✅ StudentManager created');
        }

        // Update injectable with all managers
        baseInjectable.managers = this.managers;

        // Load middlewares
        console.log('\n5. Loading middlewares...');
        const middlewaresLoader = new MiddlewaresLoader(baseInjectable);
        const mwsRepo = middlewaresLoader.load();
        baseInjectable.mwsRepo = mwsRepo;

        // Load VirtualStack and ApiHandler
        console.log('\n5b. Loading execution stack and API handler...');
        this.managers.mwsExec = new VirtualStack({
            preStack: ['__device'],
            ...baseInjectable
        });
        console.log('   ✅ VirtualStack loaded');

        this.managers.userApi = new ApiHandler({
            ...baseInjectable,
            managers: this.managers,
            prop: 'httpExposed'
        });
        console.log('   ✅ ApiHandler loaded');

        // NOW create UserServer with ALL managers
        console.log('\n5c. Creating UserServer with all managers...');
        this.managers.userServer = new UserServer({
            config: this.config,
            managers: this.managers,  // Now includes ALL managers!
            mws: mwsRepo
        });
        console.log('   ✅ UserServer created');

        // Final verification
        console.log('\n6. 📊 FINAL MANAGERS LOADED:');
        console.log('   ', Object.keys(this.managers).sort().join(', '));

        // Verify all required managers are present
        const requiredManagers = ['auth', 'school', 'classroom', 'student', 'token', 'responseDispatcher', 'mwsExec', 'userApi', 'userServer'];
        const missingManagers = requiredManagers.filter(m => !this.managers[m]);

        if (missingManagers.length > 0) {
            console.error('❌ Missing required managers:', missingManagers.join(', '));
        } else {
            console.log('✅ All required managers are present!');
        }

        console.log('='.repeat(60) + '\n');

        return this.managers;
    }
};