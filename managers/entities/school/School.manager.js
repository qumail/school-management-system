// managers/entities/school/school.manager.js
module.exports = (injectable) => {
    console.log('📚 school.manager.js initializing...');

    const { mongomodels } = injectable;
    const School = mongomodels?.School;

    if (!School) {
        console.error('❌ School model not found in school.manager');
    }

    return {
        // List all schools
        list: async (data, res) => {
            try {
                if (!School) {
                    const error = new Error('School model not available');
                    error.statusCode = 500;
                    throw error;
                }

                let filter = {};
                
                if (data.user?.role === 'school_admin') {
                    filter._id = data.user.schoolId;
                }

                if (data.isActive !== undefined) {
                    filter.isActive = data.isActive === 'true';
                }

                const schools = await School.find(filter).sort({ name: 1 });
                return schools;
            } catch (error) {
                console.error('List schools error:', error);
                error.statusCode = error.statusCode || 500;
                throw error;
            }
        },

        // Get school by ID
        get: async (data, res) => {
            try {
                if (!School) {
                    const error = new Error('School model not available');
                    error.statusCode = 500;
                    throw error;
                }

                const { id } = data;
                
                // Validate ID format
                if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
                    const error = new Error('Invalid school ID format');
                    error.statusCode = 400;
                    throw error;
                }

                const school = await School.findById(id);

                if (!school) {
                    const error = new Error('School not found');
                    error.statusCode = 404;
                    throw error;
                }

                // School admins can only access their own school
                if (data.user?.role === 'school_admin' && 
                    school._id.toString() !== data.user.schoolId) {
                    const error = new Error('You can only access your own school');
                    error.statusCode = 403;
                    throw error;
                }

                return school;
            } catch (error) {
                console.error('Get school error:', error);
                error.statusCode = error.statusCode || 500;
                throw error;
            }
        },

        // Create new school
        create: async (data, res) => {
            try {
                if (!School) {
                    const error = new Error('School model not available');
                    error.statusCode = 500;
                    throw error;
                }

                const { name, address, contactEmail, phone, principal } = data;

                // Validate required fields
                if (!name) {
                    const error = new Error('School name is required');
                    error.statusCode = 400;
                    throw error;
                }

                // Check if school with same name exists
                const existingSchool = await School.findOne({ name });
                if (existingSchool) {
                    const error = new Error('School with this name already exists');
                    error.statusCode = 409;
                    throw error;
                }

                const school = await School.create({
                    name,
                    address,
                    contactEmail,
                    phone,
                    principal,
                    isActive: true
                });

                return school;
            } catch (error) {
                console.error('Create school error:', error);
                error.statusCode = error.statusCode || 500;
                throw error;
            }
        },

        // Update school
        update: async (data, res) => {
            try {
                if (!School) {
                    const error = new Error('School model not available');
                    error.statusCode = 500;
                    throw error;
                }

                const { id } = data;
                
                // Validate ID format
                if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
                    const error = new Error('Invalid school ID format');
                    error.statusCode = 400;
                    throw error;
                }

                const updates = { ...data };
                delete updates.id;
                delete updates.user;

                const school = await School.findById(id);

                if (!school) {
                    const error = new Error('School not found');
                    error.statusCode = 404;
                    throw error;
                }

                // School admins can only update their own school
                if (data.user?.role === 'school_admin' && 
                    school._id.toString() !== data.user.schoolId) {
                    const error = new Error('You can only update your own school');
                    error.statusCode = 403;
                    throw error;
                }

                // If updating name, check for duplicates
                if (updates.name && updates.name !== school.name) {
                    const existingSchool = await School.findOne({
                        name: updates.name,
                        _id: { $ne: id }
                    });
                    if (existingSchool) {
                        const error = new Error('School with this name already exists');
                        error.statusCode = 409;
                        throw error;
                    }
                }

                const updatedSchool = await School.findByIdAndUpdate(
                    id,
                    updates,
                    { new: true, runValidators: true }
                );

                return updatedSchool;
            } catch (error) {
                console.error('Update school error:', error);
                error.statusCode = error.statusCode || 500;
                throw error;
            }
        },

        // Delete school
        delete: async (data, res) => {
            try {
                if (!School) {
                    const error = new Error('School model not available');
                    error.statusCode = 500;
                    throw error;
                }

                const { id } = data;
                
                // Validate ID format
                if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
                    const error = new Error('Invalid school ID format');
                    error.statusCode = 400;
                    throw error;
                }

                const school = await School.findById(id);

                if (!school) {
                    const error = new Error('School not found');
                    error.statusCode = 404;
                    throw error;
                }

                // Check if school has associated classrooms or students
                const Classroom = mongomodels?.Classroom;
                const Student = mongomodels?.Student;

                if (Classroom) {
                    const classroomCount = await Classroom.countDocuments({ school: id });
                    if (classroomCount > 0) {
                        const error = new Error('Cannot delete school with existing classrooms');
                        error.statusCode = 409;
                        throw error;
                    }
                }

                if (Student) {
                    const studentCount = await Student.countDocuments({ school: id });
                    if (studentCount > 0) {
                        const error = new Error('Cannot delete school with existing students');
                        error.statusCode = 409;
                        throw error;
                    }
                }

                await School.findByIdAndDelete(id);
                return;
                
            } catch (error) {
                console.error('Delete school error:', error);
                error.statusCode = error.statusCode || 500;
                throw error;
            }
        }
    };
};