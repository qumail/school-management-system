module.exports = (injectable) => {
    console.log('📚 classroom.manager.js initializing...');

    const { mongomodels } = injectable;
    const Classroom = mongomodels?.Classroom;
    const School = mongomodels?.School;
    const Student = mongomodels?.Student;

    if (!Classroom) {
        console.error('❌ Classroom model not found in classroom.manager');
    }

    return {
        // List all classrooms
        list: async (data, res) => {
            try {
                console.log('Listing classrooms with filters:', data);

                let filter = {};

                // Filter by school
                if (data.schoolId) {
                    filter.school = data.schoolId;
                }

                // Filter by grade
                if (data.grade) {
                    filter.grade = data.grade;
                }

                // Filter by active status
                if (data.isActive !== undefined) {
                    filter.isActive = data.isActive === 'true';
                }

                // School admins can only see their school's classrooms
                if (data.user?.role === 'school_admin') {
                    filter.school = data.user.schoolId;
                }

                const classrooms = await Classroom.find(filter)
                    .populate('school', 'name')
                    .sort({ name: 1 });

                // Add student count to each classroom
                const classroomsWithStats = await Promise.all(
                    classrooms.map(async (classroom) => {
                        const studentCount = await Student.countDocuments({ 
                            classroom: classroom._id,
                            isActive: true 
                        });
                        return {
                            ...classroom.toObject(),
                            studentCount,
                            availableSeats: classroom.capacity - studentCount
                        };
                    })
                );

                return classroomsWithStats;
            } catch (error) {
                console.error('List classrooms error:', error);
                throw error;
            }
        },

        // Get classroom by ID
        get: async (data, res) => {
            try {
                const { id } = data;
                console.log(`Getting classroom: ${id}`);

                const classroom = await Classroom.findById(id)
                    .populate('school', 'name address');

                if (!classroom) {
                    const error = new Error('Classroom not found');
                    error.statusCode = 404;
                    throw error;
                }

                // School admins can only access their own school's classrooms
                if (data.user?.role === 'school_admin' && 
                    classroom.school._id.toString() !== data.user.schoolId) {
                    const error = new Error('You can only access classrooms from your own school');
                    error.statusCode = 403;
                    throw error;
                }

                // Get student count
                const studentCount = await Student.countDocuments({ 
                    classroom: id,
                    isActive: true 
                });

                return {
                    ...classroom.toObject(),
                    studentCount,
                    availableSeats: classroom.capacity - studentCount
                };
            } catch (error) {
                console.error('Get classroom error:', error);
                throw error;
            }
        },

        // Create new classroom
        create: async (data, res) => {
            try {
                console.log('Creating classroom with data:', data);

                const { name, capacity, grade, section, resources, schoolId } = data;

                // Validate required fields
                if (!name || !schoolId) {
                    const error = new Error('Classroom name and school ID are required');
                    error.statusCode = 400;
                    throw error
                }

                // Check if school exists
                const school = await School.findById(schoolId);
                if (!school) {
                    const error = new Error('School not found');
                    error.statusCode = 404;
                    throw error;
                }

                // School admins can only create classrooms in their own school
                if (data.user?.role === 'school_admin' && 
                    schoolId !== data.user.schoolId) {
                    const error = new Error('You can only create classrooms in your own school');
                    error.statusCode = 403;
                    throw error;
                }

                // Check if classroom name already exists in this school
                const existingClassroom = await Classroom.findOne({
                    school: schoolId,
                    name: name
                });

                if (existingClassroom) {
                    const error = new Error('A classroom with this name already exists in this school');
                    error.statusCode = 409;
                    throw error;
                }

                // Create classroom
                const classroom = await Classroom.create({
                    name,
                    capacity: capacity || 30,
                    grade,
                    section,
                    resources: resources || [],
                    school: schoolId,
                    isActive: true
                });

                return classroom;
            } catch (error) {
                console.error('Create classroom error:', error);
                throw error;
            }
        },

        // Update classroom
        update: async (data, res) => {
            try {
                const { id } = data;
                const updates = { ...data };
                delete updates.id;
                delete updates.user;

                console.log(`Updating classroom: ${id}`, updates);

                const classroom = await Classroom.findById(id);

                if (!classroom) {
                    const error = new Error('Classroom not found');
                    error.statusCode = 404;
                    throw error;
                }


                // School admins can only update their own school's classrooms
                if (data.user?.role === 'school_admin' && 
                    classroom.school.toString() !== data.user.schoolId) {
                    const error = new Error('You can only update classrooms from your own school');
                    error.statusCode = 403;
                    throw error;
                }

                // If updating name, check for duplicates in the same school
                if (updates.name && updates.name !== classroom.name) {
                    const existingClassroom = await Classroom.findOne({
                        school: classroom.school,
                        name: updates.name,
                        _id: { $ne: id }
                    });

                    if (existingClassroom) {
                        const error = new Error('A classroom with this name already exists in this school');
                        error.statusCode = 409;
                        throw error;
                    }
                }

                // If reducing capacity, check if it's below current student count
                if (updates.capacity && updates.capacity < classroom.capacity) {
                    const studentCount = await Student.countDocuments({ classroom: id });
                    if (studentCount > updates.capacity) {
                        const error = new Error(`Cannot reduce capacity below current student count (${studentCount})`);
                        error.statusCode = 400;
                        throw error;
                    }
                }

                const updatedClassroom = await Classroom.findByIdAndUpdate(
                    id,
                    updates,
                    { new: true, runValidators: true }
                ).populate('school', 'name');

                return updatedClassroom;
            } catch (error) {
                console.error('Update classroom error:', error);
                throw error;
            }
        },

        // Delete classroom
        delete: async (data, res) => {
            try {
                const { id } = data;
                console.log(`Deleting classroom: ${id}`);

                const classroom = await Classroom.findById(id);

                if (!classroom) {
                    const error = new Error('Classroom not found');
                    error.statusCode = 404;
                    throw error;
                }

                // School admins can only delete their own school's classrooms
                if (data.user?.role === 'school_admin' && 
                    classroom.school !== data.user.schoolId) {
                    const error = new Error('You can only delete classrooms from your own school');
                    error.statusCode = 403;
                    throw error;
                }

                // Check if classroom has students
                const studentCount = await Student.countDocuments({ classroom: id });
                if (studentCount > 0) {
                    const error = new Error('Cannot delete classroom with assigned students');
                    error.statusCode = 400;
                    throw error;
                }

                await Classroom.findByIdAndDelete(id);

                return { message: 'Classroom deleted successfully' };
            } catch (error) {
                console.error('Delete classroom error:', error);
                throw error;
            }
        },

        // Get classroom statistics
        getStats: async (data, res) => {
            try {
                const { id } = data;
                console.log(`Getting stats for classroom: ${id}`);

                const classroom = await Classroom.findById(id);

                if (!classroom) {
                    const error = new Error('Classroom not found');
                    error.statusCode = 404;
                    throw error;
                }

                // School admins can only access their own school's classrooms
                if (data.user?.role === 'school_admin' && 
                    classroom.school.toString() !== data.user.schoolId) {
                    throw new Error('You can only access classrooms from your own school');
                }

                const studentCount = await Student.countDocuments({ classroom: id });
                const activeStudents = await Student.countDocuments({ 
                    classroom: id, 
                    isActive: true 
                });

                return {
                    _id: classroom._id,
                    name: classroom.name,
                    capacity: classroom.capacity,
                    totalStudents: studentCount,
                    activeStudents,
                    availableSeats: classroom.capacity - activeStudents,
                    utilizationRate: classroom.capacity ? 
                        ((activeStudents / classroom.capacity) * 100).toFixed(2) : 0,
                    resources: classroom.resources || [],
                    grade: classroom.grade,
                    section: classroom.section,
                    isActive: classroom.isActive
                };
            } catch (error) {
                console.error('Get classroom stats error:', error);
                throw error;
            }
        },

        // Get students in classroom
        getStudents: async (data, res) => {
            try {
                const { id } = data;
                console.log(`Getting students for classroom: ${id}`);

                const classroom = await Classroom.findById(id);

                if (!classroom) {
                    throw new Error('Classroom not found');
                }

                // School admins can only access their own school's classrooms
                if (data.user?.role === 'school_admin' && 
                    classroom.school.toString() !== data.user.schoolId) {
                    throw new Error('You can only access classrooms from your own school');
                }

                const students = await Student.find({ classroom: id })
                    .sort({ lastName: 1, firstName: 1 });

                return students;
            } catch (error) {
                console.error('Get classroom students error:', error);
                throw error;
            }
        },

        // List classrooms by school
        listBySchool: async (data, res) => {
            try {
                const { schoolId } = data;
                console.log(`Listing classrooms for school: ${schoolId}`);

                // Check if school exists
                const school = await School.findById(schoolId);
                if (!school) {
                    const error = new Error('School not found');
                    error.statusCode = 404;
                    throw error;
                }

                // School admins can only access their own school
                if (data.user?.role === 'school_admin' && 
                    schoolId !== data.user.schoolId) {
                    const error = new Error('You can only access classrooms from your own school');
                    error.statusCode = 403;
                    throw error;
                }

                const classrooms = await Classroom.find({ school: schoolId })
                    .sort({ name: 1 });

                // Add student counts
                const classroomsWithStats = await Promise.all(
                    classrooms.map(async (classroom) => {
                        const studentCount = await Student.countDocuments({ 
                            classroom: classroom._id 
                        });
                        return {
                            ...classroom.toObject(),
                            studentCount,
                            availableSeats: classroom.capacity - studentCount
                        };
                    })
                );

                return classroomsWithStats;
            } catch (error) {
                console.error('List classrooms by school error:', error);
                throw error;
            }
        },

        // Update classroom capacity
        updateCapacity: async (data, res) => {
            try {
                const { id } = data;
                const { capacity } = data;

                if (!capacity || capacity < 1) {
                    throw new Error('Valid capacity is required');
                }

                const classroom = await Classroom.findById(id);

                if (!classroom) {
                    throw new Error('Classroom not found');
                }

                // School admins can only update their own school's classrooms
                if (data.user?.role === 'school_admin' && 
                    classroom.school.toString() !== data.user.schoolId) {
                    throw new Error('You can only update classrooms from your own school');
                }

                const studentCount = await Student.countDocuments({ classroom: id });
                if (capacity < studentCount) {
                    const error = new Error(`Cannot set capacity below current student count (${studentCount})`);
                    error.statusCode = 400;
                    throw error;
                }

                classroom.capacity = capacity;
                await classroom.save();

                return classroom;
            } catch (error) {
                console.error('Update capacity error:', error);
                throw error;
            }
        },

        // Add resource to classroom
        addResource: async (data, res) => {
            try {
                const { id } = data;
                const { resource } = data;

                if (!resource) {
                    throw new Error('Resource is required');
                }

                const classroom = await Classroom.findById(id);

                if (!classroom) {
                    throw new Error('Classroom not found');
                }

                // School admins can only update their own school's classrooms
                if (data.user?.role === 'school_admin' && 
                    classroom.school.toString() !== data.user.schoolId) {
                    throw new Error('You can only update classrooms from your own school');
                }

                if (!classroom.resources) {
                    classroom.resources = [];
                }

                if (!classroom.resources.includes(resource)) {
                    classroom.resources.push(resource);
                    await classroom.save();
                }

                return classroom;
            } catch (error) {
                console.error('Add resource error:', error);
                throw error;
            }
        },

        // Remove resource from classroom
        removeResource: async (data, res) => {
            try {
                const { id } = data;
                const { resource } = data;

                const classroom = await Classroom.findById(id);

                if (!classroom) {
                    throw new Error('Classroom not found');
                }

                // School admins can only update their own school's classrooms
                if (data.user?.role === 'school_admin' && 
                    classroom.school.toString() !== data.user.schoolId) {
                    throw new Error('You can only update classrooms from your own school');
                }

                if (classroom.resources) {
                    classroom.resources = classroom.resources.filter(r => r !== resource);
                    await classroom.save();
                }

                return classroom;
            } catch (error) {
                console.error('Remove resource error:', error);
                throw error;
            }
        },

        // Bulk create classrooms
        bulkCreate: async (data, res) => {
            try {
                const { classrooms } = data;

                if (!classrooms || !Array.isArray(classrooms) || classrooms.length === 0) {
                    throw new Error('Valid classrooms array is required');
                }

                const created = [];
                const errors = [];

                for (const classroomData of classrooms) {
                    try {
                        const classroom = await Classroom.create({
                            ...classroomData,
                            isActive: true
                        });
                        created.push(classroom);
                    } catch (error) {
                        errors.push({
                            data: classroomData,
                            error: error.message
                        });
                    }
                }

                return {
                    created,
                    errors,
                    totalCreated: created.length,
                    totalErrors: errors.length
                };
            } catch (error) {
                console.error('Bulk create classrooms error:', error);
                throw error;
            }
        }
    };
};