// libs/RouteLoader.js
const fs = require('fs');
const path = require('path');

/**
 * Route Loader - Dynamically loads all route files from the routes directory
 */
module.exports = class RouteLoader {
    constructor(routesPath) {
        this.routesPath = routesPath || path.join(__dirname, '../routes');
    }

    /**
     * Load all route files and register them with the registry
     */
    loadRoutes(registry, managers) {
        console.log('\n📂 Loading routes...');

        if (!fs.existsSync(this.routesPath)) {
            console.warn(`⚠️ Routes directory not found: ${this.routesPath}`);
            return;
        }

        const routeFiles = fs.readdirSync(this.routesPath)
            .filter(file => file.endsWith('.routes.js'))
            .sort(); // Load in alphabetical order

        const loadedRoutes = [];

        routeFiles.forEach(file => {
            try {
                const routePath = path.join(this.routesPath, file);
                const routeModule = require(routePath);
                
                if (typeof routeModule === 'function') {
                    routeModule(registry, managers);
                    loadedRoutes.push(file);
                } else {
                    console.warn(`⚠️ Route file ${file} does not export a function`);
                }
            } catch (error) {
                console.error(`❌ Error loading route file ${file}:`, error.message);
            }
        });

        console.log(`✅ Loaded ${loadedRoutes.length} route files: ${loadedRoutes.join(', ')}`);
        return loadedRoutes;
    }

    /**
     * Load a specific route file
     */
    loadRoute(registry, managers, fileName) {
        const filePath = path.join(this.routesPath, fileName);
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`Route file not found: ${fileName}`);
        }

        const routeModule = require(filePath);
        
        if (typeof routeModule === 'function') {
            routeModule(registry, managers);
            console.log(`✅ Loaded route: ${fileName}`);
        } else {
            throw new Error(`Route file ${fileName} does not export a function`);
        }
    }
};