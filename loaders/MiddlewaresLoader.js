// loaders/MiddlewaresLoader.js
const loader = require('./_common/fileLoader');

module.exports = class MiddlewaresLoader {
    constructor(injectable) {
        this.mws = {};
        this.injectable = injectable;
    }

    load() {
        console.log('🔧 Loading middleware files...');
        
        const mws = loader('./mws/**/*.mw.js');

        Object.keys(mws).forEach(ik => {
            console.log(`   Loading middleware: ${ik}`);
            
            if (typeof mws[ik] !== 'function') {
                throw new Error(`Middleware ${ik} does not export a builder function`);
            }

            try {
                const built = mws[ik](this.injectable);
                
                // Check what type the middleware returned
                if (typeof built === 'function') {
                    // It's a function middleware
                    this.mws[ik] = built;
                    console.log(`   ✅ Loaded function middleware: ${ik}`);
                } else if (typeof built === 'object' && built !== null) {
                    // It's an object with multiple middleware functions
                    this.mws[ik] = built;
                    console.log(`   ✅ Loaded object middleware: ${ik} with methods:`, Object.keys(built));
                } else {
                    throw new Error(`Middleware ${ik} returned invalid type: ${typeof built}`);
                }
            } catch (error) {
                console.error(`   ❌ Error loading middleware ${ik}:`, error);
                throw error;
            }
        });

        console.log('✅ Loaded middleware:', Object.keys(this.mws));
        return this.mws;
    }
};