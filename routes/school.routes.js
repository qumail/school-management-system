// routes/school.routes.js
/**
 * School Routes
 */
module.exports = (registry, managers) => {
    // Safely access school manager with null check
    const school = managers?.School || managers?.school;
    
    if (!school) {
        console.warn('⚠️ School manager not found, skipping school routes');
        console.log('   Available managers:', Object.keys(managers || {}).join(', '));
        return;
    }

    console.log('📝 Registering school routes...');
    console.log('   School manager methods:', Object.keys(school).join(', '));

    // Main school resource - with null checks
    if (school.list) {
        registry.protected('get', '/api/schools', 
            school.list, 
            ['superadmin', 'school_admin']
        );
    }

    if (school.get) {
        registry.protected('get', '/api/schools/:id', 
            school.get, 
            ['superadmin', 'school_admin']
        );
    }

    if (school.create) {
        registry.protected('post', '/api/schools', 
            school.create, 
            ['superadmin']
        );
    }

    if (school.update) {
        registry.protected('put', '/api/schools/:id', 
            school.update, 
            ['superadmin', 'school_admin']
        );
    }

    if (school.delete) {
        registry.protected('delete', '/api/schools/:id', 
            school.delete, 
            ['superadmin']
        );
    }

    // Additional routes with null checks
    if (school.getStats) {
        registry.protected('get', '/api/schools/stats/overview', 
            school.getStats, 
            ['superadmin']
        );
    }

    if (school.getClassrooms) {
        registry.protected('get', '/api/schools/:id/classrooms', 
            school.getClassrooms, 
            ['superadmin', 'school_admin']
        );
    }

    if (school.getStudents) {
        registry.protected('get', '/api/schools/:id/students', 
            school.getStudents, 
            ['superadmin', 'school_admin']
        );
    }

    // Toggle school status
    if (school.toggleStatus) {
        registry.protected('patch', '/api/schools/:id/toggle-status',
            school.toggleStatus,
            ['superadmin']
        );
    }

    console.log('✅ School routes registered successfully');
};