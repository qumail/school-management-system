// // loaders/EntitiesLoader.js
// const fs = require('fs');
// const path = require('path');

// module.exports = class EntitiesLoader {
//     constructor({ injectable }) {
//         this.injectable = injectable;
//         this.entitiesPath = path.join(__dirname, '../managers/entities');
//     }

//     load() {
//         console.log('\n📚 Loading entity managers from folders...');
        
//         const loadedEntities = {};
        
//         if (!fs.existsSync(this.entitiesPath)) {
//             console.error(`❌ Entities path not found: ${this.entitiesPath}`);
//             return loadedEntities;
//         }

//         const entityFolders = fs.readdirSync(this.entitiesPath, { withFileTypes: true })
//             .filter(dirent => dirent.isDirectory())
//             .map(dirent => dirent.name);

//         console.log(`   Found entity folders: ${entityFolders.join(', ')}`);

//         entityFolders.forEach(folder => {
//             try {
//                 const managerPath = path.join(this.entitiesPath, folder, `${folder}.manager.js`);
                
//                 if (fs.existsSync(managerPath)) {
//                     console.log(`   📦 Loading ${folder}.manager.js...`);
                    
//                     const ManagerModule = require(managerPath);
                    
//                     // Check if it's a class (requires 'new')
//                     const isClass = ManagerModule.toString().startsWith('class') || 
//                                    (ManagerModule.prototype && 
//                                     ManagerModule.prototype.constructor.toString().startsWith('class'));
                    
//                     const managerName = folder.charAt(0).toUpperCase() + folder.slice(1);
                    
//                     if (isClass) {
//                         // It's a class - instantiate with new
//                         console.log(`   🏭 Instantiating class-based manager: ${folder}`);
//                         loadedEntities[managerName] = new ManagerModule(this.injectable);
//                     } else if (typeof ManagerModule === 'function') {
//                         // It's a function - call it
//                         console.log(`   📦 Loading function-based manager: ${folder}`);
//                         loadedEntities[managerName] = ManagerModule(this.injectable);
//                     } else {
//                         // It's an object - use directly
//                         console.log(`   📦 Using object-based manager: ${folder}`);
//                         loadedEntities[managerName] = ManagerModule;
//                     }
                    
//                     console.log(`   ✅ Loaded ${managerName} manager`);
//                 } else {
//                     console.warn(`   ⚠️ No manager file found for ${folder}`);
//                 }
//             } catch (error) {
//                 console.error(`   ❌ Error loading ${folder} manager:`, error.message);
//             }
//         });

//         console.log(`\n✅ Loaded ${Object.keys(loadedEntities).length} entity managers:`, Object.keys(loadedEntities).join(', '));
//         return loadedEntities;
//     }
// };

// loaders/EntitiesLoader.js
const fs = require('fs');
const path = require('path');

module.exports = class EntitiesLoader {
    constructor({ injectable }) {
        this.injectable = injectable;
        this.entitiesPath = path.join(__dirname, '../managers/entities');
        
        // Log what's in injectable when created
        console.log('📋 EntitiesLoader created with injectable keys:', Object.keys(injectable || {}));
        console.log('   mongomodels keys:', Object.keys(injectable?.mongomodels || {}));
    }

    load() {
        console.log('\n📚 Loading entity managers from folders...');
        
        const loadedEntities = {};
        
        if (!fs.existsSync(this.entitiesPath)) {
            console.error(`❌ Entities path not found: ${this.entitiesPath}`);
            return loadedEntities;
        }

        const entityFolders = fs.readdirSync(this.entitiesPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        console.log(`   Found entity folders: ${entityFolders.join(', ')}`);

        entityFolders.forEach(folder => {
            try {
                const managerPath = path.join(this.entitiesPath, folder, `${folder}.manager.js`);
                
                if (fs.existsSync(managerPath)) {
                    console.log(`   📦 Loading ${folder}.manager.js...`);
                    
                    const ManagerModule = require(managerPath);
                    
                    if (typeof ManagerModule === 'function') {
                        const managerName = folder.charAt(0).toUpperCase() + folder.slice(1);
                        
                        // Log what we're passing to each manager
                        console.log(`      Passing to ${managerName}: mongomodels keys =`, 
                            Object.keys(this.injectable?.mongomodels || {}));
                        
                        loadedEntities[managerName] = ManagerModule(this.injectable);
                        
                        console.log(`   ✅ Loaded ${managerName} manager`);
                    } else {
                        console.warn(`   ⚠️ ${folder}.manager.js does not export a function`);
                    }
                } else {
                    console.warn(`   ⚠️ No manager file found for ${folder}`);
                }
            } catch (error) {
                console.error(`   ❌ Error loading ${folder} manager:`, error.message);
            }
        });

        console.log(`\n✅ Loaded ${Object.keys(loadedEntities).length} entity managers:`, Object.keys(loadedEntities).join(', '));
        return loadedEntities;
    }
};