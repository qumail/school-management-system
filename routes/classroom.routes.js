// routes/classroom.routes.js
/**
 * Classroom Routes
 */
module.exports = (registry, managers) => {
    // Safely access classroom manager with null check
    const classroom = managers?.Classroom || managers?.classroom;
    
    if (!classroom) {
        console.warn('⚠️ Classroom manager not found, skipping classroom routes');
        console.log('   Available managers:', Object.keys(managers || {}).join(', '));
        return;
    }

    console.log('📝 Registering classroom routes...');
    console.log('   Classroom manager methods:', Object.keys(classroom).join(', '));

    // Main classroom resource - with null checks for each method
    if (classroom.list) {
        registry.protected('get', '/api/classrooms', 
            classroom.list, 
            ['superadmin', 'school_admin']
        );
    }

    if (classroom.get) {
        registry.protected('get', '/api/classrooms/:id', 
            classroom.get, 
            ['superadmin', 'school_admin']
        );
    }

    if (classroom.create) {
        registry.protected('post', '/api/classrooms', 
            classroom.create, 
            ['superadmin', 'school_admin']
        );
    }

    if (classroom.update) {
        registry.protected('put', '/api/classrooms/:id', 
            classroom.update, 
            ['superadmin', 'school_admin']
        );
    }

    if (classroom.delete) {
        registry.protected('delete', '/api/classrooms/:id', 
            classroom.delete, 
            ['superadmin']
        );
    }

    // Additional routes with null checks
    if (classroom.getStats) {
        registry.protected('get', '/api/classrooms/:id/stats', 
            classroom.getStats, 
            ['superadmin', 'school_admin']
        );
    }

    if (classroom.getStudents) {
        registry.protected('get', '/api/classrooms/:id/students', 
            classroom.getStudents, 
            ['superadmin', 'school_admin']
        );
    }

    // Nested routes under schools
    if (classroom.listBySchool) {
        registry.protected('get', '/api/schools/:schoolId/classrooms', 
            classroom.listBySchool, 
            ['superadmin', 'school_admin']
        );
    }
    
    if (classroom.create) {  // Reuse create method for nested route
        registry.protected('post', '/api/schools/:schoolId/classrooms', 
            classroom.create, 
            ['superadmin', 'school_admin']
        );
    }

    // Bulk operations - only if methods exist
    if (classroom.bulkCreate) {
        registry.protected('post', '/api/classrooms/bulk/create', 
            classroom.bulkCreate, 
            ['superadmin']
        );
    }

    // Capacity management
    if (classroom.updateCapacity) {
        registry.protected('patch', '/api/classrooms/:id/capacity', 
            classroom.updateCapacity, 
            ['superadmin', 'school_admin']
        );
    }

    // Resource management
    if (classroom.addResource) {
        registry.protected('post', '/api/classrooms/:id/resources', 
            classroom.addResource, 
            ['superadmin', 'school_admin']
        );
    }
    
    if (classroom.removeResource) {
        registry.protected('delete', '/api/classrooms/:id/resources/:resource', 
            classroom.removeResource, 
            ['superadmin', 'school_admin']
        );
    }

    console.log('✅ Classroom routes registered successfully');
};