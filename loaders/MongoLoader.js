// loaders/MongoLoader.js
const loader = require('./_common/fileLoader');
const mongoose = require('mongoose');
const path = require('path');

module.exports = class MongoLoader {
    constructor({ schemaExtension }){
        this.schemaExtension = schemaExtension;
    }

    load(){
        console.log('\n🔍 MongoLoader scanning for files...');
        const files = loader(`./managers/entities/**/*.${this.schemaExtension}`);
        
        console.log(`Found ${Object.keys(files).length} files`);
        console.log('Files found:', Object.keys(files));

        const models = {};

        Object.keys(files).forEach(filePath => {
            console.log(`\n📄 Processing: ${filePath}`);
            
            let model = files[filePath];

            // support ES module default export
            if(model && model.default) model = model.default;

            // CASE 1: It's already a Mongoose model
            if(model && model.modelName){
                console.log(`   ✅ Found existing model: ${model.modelName}`);
                models[model.modelName] = model;
                return;
            }
            
            // CASE 2: It's a Mongoose schema
            if(model && model.obj){
                // Extract model name from the folder path
                // The path should be like: .../managers/entities/school/school.mongoModel.js
                const parsedPath = path.parse(filePath);
                const dirPath = parsedPath.dir;
                
                console.log(`   Directory path: ${dirPath}`);
                
                // Get the last folder name (should be 'school', 'user', etc.)
                const pathParts = dirPath.split(path.sep);
                const folderName = pathParts[pathParts.length - 1];
                
                console.log(`   Folder name: ${folderName}`);
                
                if (!folderName || folderName === '.' || folderName === '') {
                    console.log(`   ⚠️ Invalid folder name, trying alternative method`);
                    // Alternative: get from filename
                    const fileName = parsedPath.name; // e.g., 'school.mongoModel'
                    const baseName = fileName.split('.')[0]; // e.g., 'school'
                    const modelName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
                    console.log(`   Using filename as model name: ${modelName}`);
                    
                    if (mongoose.models[modelName]) {
                        models[modelName] = mongoose.models[modelName];
                    } else {
                        models[modelName] = mongoose.model(modelName, model);
                    }
                } else {
                    // Capitalize first letter for model name
                    const modelName = folderName.charAt(0).toUpperCase() + folderName.slice(1);
                    console.log(`   🏷️  Model name: ${modelName}`);
                    
                    try {
                        // Check if model already exists
                        if (mongoose.models[modelName]) {
                            console.log(`   🔄 Reusing existing model: ${modelName}`);
                            models[modelName] = mongoose.models[modelName];
                        } else {
                            // Create new model
                            const newModel = mongoose.model(modelName, model);
                            console.log(`   ✅ Created new model: ${modelName}`);
                            models[modelName] = newModel;
                        }
                    } catch (error) {
                        console.error(`   ❌ Error creating model:`, error.message);
                    }
                }
                return;
            }
            
            console.log(`   ⚠️ Skipping - not a model or schema:`, typeof model);
        });

        console.log('\n📊 Final models loaded:', Object.keys(models));
        return models;
    }
};