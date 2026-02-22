// routes/student.routes.js
/**
 * Student Routes
 */
module.exports = (registry, managers) => {
    // Safely access student manager with null check (check both possible names)
    const student = managers?.Student || managers?.student;
    
    if (!student) {
        console.warn('⚠️ Student manager not found, skipping student routes');
        console.log('   Available managers:', Object.keys(managers || {}).join(', '));
        return;
    }

    console.log('📝 Registering student routes...');
    console.log('   Student manager methods:', Object.keys(student).join(', '));

    // Main student resource - with null checks
    if (student.list) {
        registry.protected('get', '/api/students', 
            student.list, 
            ['superadmin', 'school_admin']
        );
    }

    if (student.get) {
        registry.protected('get', '/api/students/:id', 
            student.get, 
            ['superadmin', 'school_admin']
        );
    }

    if (student.create) {
        registry.protected('post', '/api/students', 
            student.create, 
            ['superadmin', 'school_admin']
        );
    }

    if (student.update) {
        registry.protected('put', '/api/students/:id', 
            student.update, 
            ['superadmin', 'school_admin']
        );
    }

    if (student.delete) {
        registry.protected('delete', '/api/students/:id', 
            student.delete, 
            ['superadmin', 'school_admin']
        );
    }

    // Additional routes with null checks
    if (student.getAttendance) {
        registry.protected('get', '/api/students/:id/attendance', 
            student.getAttendance, 
            ['superadmin', 'school_admin']
        );
    }

    if (student.getGrades) {
        registry.protected('get', '/api/students/:id/grades', 
            student.getGrades, 
            ['superadmin', 'school_admin']
        );
    }

    if (student.getTimeline) {
        registry.protected('get', '/api/students/:id/timeline', 
            student.getTimeline, 
            ['superadmin', 'school_admin']
        );
    }

    // Nested routes under schools
    if (student.listBySchool) {
        registry.protected('get', '/api/schools/:schoolId/students', 
            student.listBySchool, 
            ['superadmin', 'school_admin']
        );
    }
    
    if (student.create) {
        registry.protected('post', '/api/schools/:schoolId/students', 
            student.create, 
            ['superadmin', 'school_admin']
        );
    }

    // Nested routes under classrooms
    if (student.listByClassroom) {
        registry.protected('get', '/api/classrooms/:classroomId/students', 
            student.listByClassroom, 
            ['superadmin', 'school_admin']
        );
    }

    // Student transfer and enrollment
    if (student.transfer) {
        registry.protected('post', '/api/students/:id/transfer', 
            student.transfer, 
            ['superadmin', 'school_admin']
        );
    }
    
    if (student.enroll) {
        registry.protected('post', '/api/students/:id/enroll', 
            student.enroll, 
            ['superadmin', 'school_admin']
        );
    }
    
    if (student.withdraw) {
        registry.protected('post', '/api/students/:id/withdraw', 
            student.withdraw, 
            ['superadmin', 'school_admin']
        );
    }

    // Bulk operations
    if (student.bulkImport) {
        registry.protected('post', '/api/students/bulk/import', 
            student.bulkImport, 
            ['superadmin']
        );
    }
    
    if (student.bulkTransfer) {
        registry.protected('post', '/api/students/bulk/transfer', 
            student.bulkTransfer, 
            ['superadmin']
        );
    }

    // Search and filters
    if (student.search) {
        registry.protected('get', '/api/students/search', 
            student.search, 
            ['superadmin', 'school_admin']
        );
    }

    // Student statistics
    if (student.getStats) {
        registry.protected('get', '/api/students/stats/overview', 
            student.getStats, 
            ['superadmin']
        );
    }
    
    if (student.getSchoolStats) {
        registry.protected('get', '/api/schools/:schoolId/students/stats', 
            student.getSchoolStats, 
            ['superadmin', 'school_admin']
        );
    }

    console.log('✅ Student routes registered successfully');
};