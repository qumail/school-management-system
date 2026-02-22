module.exports = (injectable) => {
    console.log('👨‍🎓 student.manager.js initializing...');

    const { mongomodels } = injectable;
    const Student = mongomodels?.Student;
    const School = mongomodels?.School;
    const Classroom = mongomodels?.Classroom;

    if (!Student) {
        console.error('❌ Student model not found in student.manager');
    }

    return {
        // List all students with filters
        list: async (data, res) => {
            try {
                console.log('Listing students with filters:', data);

                let filter = {};

                // Apply filters
                if (data.schoolId) {
                    filter.school = data.schoolId;
                }
                if (data.classroomId) {
                    filter.classroom = data.classroomId;
                }
                if (data.grade) {
                    filter.grade = data.grade;
                }
                if (data.isActive !== undefined) {
                    filter.isActive = data.isActive === 'true';
                }
                if (data.search) {
                    filter.$or = [
                        { firstName: { $regex: data.search, $options: 'i' } },
                        { lastName: { $regex: data.search, $options: 'i' } },
                        { email: { $regex: data.search, $options: 'i' } }
                    ];
                }

                // School admins can only see their school's students
                if (data.user?.role === 'school_admin') {
                    filter.school = data.user.schoolId;
                }

                const students = await Student.find(filter)
                    .populate('school', 'name')
                    .populate('classroom', 'name grade section')
                    .sort({ name: 1 });

                    console.log(`*******************${students}*****************`)
                return students;
            } catch (error) {
                console.error('List students error:', error);
                throw error;
            }
        },

        // Get student by ID
        get: async (data, res) => {
            try {
                const { id } = data;
                console.log(`Getting student: ${id}`);

                const student = await Student.findById(id)
                    .populate('school', 'name address contactEmail')
                    .populate('classroom', 'name grade section capacity');

                if (!student) {
                    const error = new Error('Student not found');
                    error.statusCode = 404;
                    throw error;
                }

                // School admins can only access their own school's students
                if (data.user?.role === 'school_admin' && 
                    student.school._id.toString() !== data.user.schoolId) {
                    const error = new Error('You can only access students from your own school');
                    error.statusCode = 403;
                    throw error;
                }

                return student;
            } catch (error) {
                console.error('Get student error:', error);
                throw error;
            }
        },

        // Create new student
        create: async (data, res) => {
            try {
                console.log('Creating student with data:', data);

                const { 
                    name, email, dateOfBirth, gender, 
                    address, phone, schoolId, classroomId, grade,
                    emergencyContact 
                } = data;

                // Validate required fields
                if (!name || !schoolId) {
                    const error = new Error('Name and school ID are required');
                    error.statusCode = 400;
                    throw error;
                }

                // Check if school exists
                const school = await School.findById(schoolId);
                if (!school) {
                    const error = new Error('School not found');
                    error.statusCode = 404;
                    throw error;
                }

                // School admins can only create students in their own school
                if (data.user?.role === 'school_admin' && 
                    schoolId !== data.user.schoolId) {
                    throw new Error('You can only create students in your own school');
                }

                // Check if classroom exists and belongs to the school (if provided)
                if (classroomId) {
                    const classroom = await Classroom.findOne({
                        _id: classroomId,
                        school: schoolId
                    });
                    
                    if (!classroom) {
                        throw new Error('Classroom not found or does not belong to the specified school');
                    }

                    // Check if classroom has capacity
                    const studentCount = await Student.countDocuments({ 
                        classroom: classroomId,
                        isActive: true 
                    });
                    
                    if (classroom.capacity && studentCount >= classroom.capacity) {
                        throw new Error('Classroom has reached maximum capacity');
                    }
                }

                // Check if email is unique (if provided)
                if (email) {
                    const existingStudent = await Student.findOne({ email });
                    if (existingStudent) {
                        const error = new Error('Student with this email already exists');
                        error.statusCode = 409;
                        throw error;
                    }
                }

                // Create student
                const student = await Student.create({
                    name,
                    email,
                    dateOfBirth,
                    gender,
                    address,
                    phone,
                    school: schoolId,
                    classroom: classroomId,
                    grade,
                    emergencyContact,
                    enrollmentDate: new Date(),
                    isActive: true,
                    transferHistory: []
                });

                return student;
            } catch (error) {
                console.error('Create student error:', error);
                throw error;
            }
        },

        // Update student
        update: async (data, res) => {
            try {
                const { id } = data;
                const updates = { ...data };
                delete updates.id;
                delete updates.user;

                console.log(`Updating student: ${id}`, updates);

                const student = await Student.findById(id);

                if (!student) {
                    throw new Error('Student not found');
                }

                // School admins can only update their own school's students
                if (data.user?.role === 'school_admin' && 
                    student.school.toString() !== data.user.schoolId) {
                    const error = new Error('You can only update students from your own school');
                    error.statusCode = 403;
                    throw error;
                }

                // If updating classroom, verify it belongs to the same school
                if (updates.classroom && updates.classroom !== student.classroom?.toString()) {
                    const classroom = await Classroom.findOne({
                        _id: updates.classroom,
                        school: student.school
                    });
                    
                    if (!classroom) {
                        throw new Error('Classroom not found or does not belong to the student\'s school');
                    }

                    // Check classroom capacity
                    const studentCount = await Student.countDocuments({ 
                        classroom: updates.classroom,
                        isActive: true,
                        _id: { $ne: id }
                    });
                    
                    if (classroom.capacity && studentCount >= classroom.capacity) {
                        throw new Error('Classroom has reached maximum capacity');
                    }
                }

                // If updating email, check uniqueness
                if (updates.email && updates.email !== student.email) {
                    const existingStudent = await Student.findOne({ 
                        email: updates.email,
                        _id: { $ne: id }
                    });
                    if (existingStudent) {
                        throw new Error('Student with this email already exists');
                    }
                }

                // Update student
                const updatedStudent = await Student.findByIdAndUpdate(
                    id,
                    updates,
                    { new: true, runValidators: true }
                ).populate('school', 'name')
                 .populate('classroom', 'name grade');

                return updatedStudent;
            } catch (error) {
                console.error('Update student error:', error);
                throw error;
            }
        },

        // Delete student
        delete: async (data, res) => {
            try {
                const { id } = data;
                console.log(`Deleting student: ${id}`);

                const student = await Student.findById(id);

                if (!student) {
                    throw new Error('Student not found');
                }

                // School admins can only delete their own school's students
                if (data.user?.role === 'school_admin' && 
                    student.school !== data.user.schoolId) {
                    const error = new Error('You can only delete students from your own school');
                    error.statusCode = 403;
                    throw error;
                }

                // Instead of hard delete, soft delete by setting isActive to false
                student.isActive = false;
                await student.save();

                return { message: 'Student deactivated successfully' };
            } catch (error) {
                console.error('Delete student error:', error);
                throw error;
            }
        },

        // List students by school
        listBySchool: async (data, res) => {
            try {
                const { schoolId } = data;
                console.log(`Listing students for school: ${schoolId}`);

                // Check if school exists
                const school = await School.findById(schoolId);
                if (!school) {
                    throw new Error('School not found');
                }

                // School admins can only access their own school
                if (data.user?.role === 'school_admin' && 
                    schoolId !== data.user.schoolId) {
                    throw new Error('You can only access students from your own school');
                }

                const students = await Student.find({ 
                    school: schoolId,
                    isActive: true 
                })
                .populate('classroom', 'name')
                .sort({ lastName: 1, firstName: 1 });

                return students;
            } catch (error) {
                console.error('List students by school error:', error);
                throw error;
            }
        },

        // List students by classroom
        listByClassroom: async (data, res) => {
            try {
                const { classroomId } = data;
                console.log(`Listing students for classroom: ${classroomId}`);

                // Check if classroom exists
                const classroom = await Classroom.findById(classroomId).populate('school');
                if (!classroom) {
                    throw new Error('Classroom not found');
                }

                // School admins can only access their own school's classrooms
                if (data.user?.role === 'school_admin' && 
                    classroom.school._id.toString() !== data.user.schoolId) {
                    throw new Error('You can only access students from your own school');
                }

                const students = await Student.find({ 
                    classroom: classroomId,
                    isActive: true 
                })
                .sort({ lastName: 1, firstName: 1 });

                return students;
            } catch (error) {
                console.error('List students by classroom error:', error);
                throw error;
            }
        },

        // Transfer student
        transfer: async (data, res) => {
            try {
                const { id } = data;
                const { targetSchoolId, targetClassroomId, reason } = data;

                console.log(`Transferring student ${id} to school: ${targetSchoolId}`);

                const student = await Student.findById(id);

                if (!student) {
                    throw new Error('Student not found');
                }

                // Check permissions
                if (data.user?.role === 'school_admin') {
                    if (student.school.toString() !== data.user.schoolId) {
                        throw new Error('You can only transfer students from your own school');
                    }
                }

                // Verify target school exists
                const targetSchool = await School.findById(targetSchoolId);
                if (!targetSchool) {
                    const error = new Error('Target school not found');
                    error.statusCode = 404;
                    throw error;
                }

                // If target classroom provided, verify it belongs to target school
                if (targetClassroomId) {
                    const targetClassroom = await Classroom.findOne({
                        _id: targetClassroomId,
                        school: targetSchoolId
                    });
                    
                    if (!targetClassroom) {
                        throw new Error('Target classroom not found or does not belong to target school');
                    }

                    // Check classroom capacity
                    const studentCount = await Student.countDocuments({ 
                        classroom: targetClassroomId,
                        isActive: true 
                    });
                    
                    if (targetClassroom.capacity && studentCount >= targetClassroom.capacity) {
                        throw new Error('Target classroom has reached maximum capacity');
                    }
                }

                // Record transfer history
                const transferRecord = {
                    fromSchool: student.school,
                    toSchool: targetSchoolId,
                    fromClassroom: student.classroom,
                    toClassroom: targetClassroomId,
                    date: new Date(),
                    reason: reason || 'Transfer'
                };

                // Update student
                student.school = targetSchoolId;
                student.classroom = targetClassroomId || null;
                
                if (!student.transferHistory) {
                    student.transferHistory = [];
                }
                student.transferHistory.push(transferRecord);

                await student.save();

                return {
                    message: 'Student transferred successfully',
                    student,
                    transferRecord
                };
            } catch (error) {
                console.error('Transfer student error:', error);
                throw error;
            }
        },

        // Enroll student in classroom
        enroll: async (data, res) => {
            try {
                const { id } = data;
                const { classroomId } = data;

                console.log(`Enrolling student ${id} in classroom: ${classroomId}`);

                const student = await Student.findById(id);

                if (!student) {
                    throw new Error('Student not found');
                }

                // Check permissions
                if (data.user?.role === 'school_admin' && 
                    student.school.toString() !== data.user.schoolId) {
                    throw new Error('You can only enroll students from your own school');
                }

                // Verify classroom exists and belongs to student's school
                const classroom = await Classroom.findOne({
                    _id: classroomId,
                    school: student.school
                });

                if (!classroom) {
                    const error = new Error('Classroom not found or does not belong to student\'s school');
                    error.statusCode = 404;
                    throw error;
                }

                // Check classroom capacity
                const studentCount = await Student.countDocuments({ 
                    classroom: classroomId,
                    isActive: true 
                });
                
                if (classroom.capacity && studentCount >= classroom.capacity) {
                    const error = new Error('Classroom has reached maximum capacity');
                    error.statusCode = 400;
                    throw error;
                }

                // Update student
                student.classroom = classroomId;
                await student.save();

                return student;
            } catch (error) {
                console.error('Enroll student error:', error);
                throw error;
            }
        },

        // Withdraw student
        withdraw: async (data, res) => {
            try {
                const { id } = data;
                const { reason } = data;

                console.log(`Withdrawing student ${id}`);

                const student = await Student.findById(id);

                if (!student) {
                    throw new Error('Student not found');
                }

                // Check permissions
                if (data.user?.role === 'school_admin' && 
                    student.school.toString() !== data.user.schoolId) {
                    throw new Error('You can only withdraw students from your own school');
                }

                // Record withdrawal in history
                if (!student.transferHistory) {
                    student.transferHistory = [];
                }
                
                student.transferHistory.push({
                    date: new Date(),
                    reason: reason || 'Withdrawal',
                    type: 'withdrawal'
                });

                // Soft delete
                student.isActive = false;
                student.classroom = null;
                await student.save();

                return { message: 'Student withdrawn successfully' };
            } catch (error) {
                console.error('Withdraw student error:', error);
                throw error;
            }
        },

        // Search students
        search: async (data, res) => {
            try {
                const { q, schoolId } = data;

                if (!q) {
                    throw new Error('Search query is required');
                }

                let filter = {
                    $or: [
                        { firstName: { $regex: q, $options: 'i' } },
                        { lastName: { $regex: q, $options: 'i' } },
                        { email: { $regex: q, $options: 'i' } }
                    ]
                };

                // Filter by school
                if (schoolId) {
                    filter.school = schoolId;
                }

                // School admins can only search their own school
                if (data.user?.role === 'school_admin') {
                    filter.school = data.user.schoolId;
                }

                const students = await Student.find(filter)
                    .populate('school', 'name')
                    .populate('classroom', 'name')
                    .limit(50);

                return students;
            } catch (error) {
                console.error('Search students error:', error);
                throw error;
            }
        },

        // Get student statistics
        getStats: async (data, res) => {
            try {
                console.log('Getting student statistics...');

                const totalStudents = await Student.countDocuments({ isActive: true });
                const totalMale = await Student.countDocuments({ gender: 'male', isActive: true });
                const totalFemale = await Student.countDocuments({ gender: 'female', isActive: true });
                
                // Students by grade
                const studentsByGrade = await Student.aggregate([
                    { $match: { isActive: true } },
                    { $group: { _id: '$grade', count: { $sum: 1 } } },
                    { $sort: { _id: 1 } }
                ]);

                // Recently enrolled (last 30 days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                const recentEnrollments = await Student.countDocuments({
                    enrollmentDate: { $gte: thirtyDaysAgo },
                    isActive: true
                });

                return {
                    totalStudents,
                    totalMale,
                    totalFemale,
                    studentsByGrade,
                    recentEnrollments,
                    activePercentage: totalStudents > 0 ? 100 : 0
                };
            } catch (error) {
                console.error('Get student stats error:', error);
                throw error;
            }
        },

        // Get school student statistics
        getSchoolStats: async (data, res) => {
            try {
                const { schoolId } = data;

                if (!schoolId) {
                    throw new Error('School ID is required');
                }

                const totalStudents = await Student.countDocuments({ 
                    school: schoolId,
                    isActive: true 
                });
                
                const studentsByClassroom = await Student.aggregate([
                    { 
                        $match: { 
                            school: mongomodels.mongoose.Types.ObjectId(schoolId),
                            isActive: true 
                        } 
                    },
                    { $group: { _id: '$classroom', count: { $sum: 1 } } }
                ]);

                return {
                    schoolId,
                    totalStudents,
                    studentsByClassroom
                };
            } catch (error) {
                console.error('Get school student stats error:', error);
                throw error;
            }
        },

        // Get student attendance (placeholder)
        getAttendance: async (data, res) => {
            try {
                const { id } = data;
                const { startDate, endDate } = data;

                console.log(`Getting attendance for student ${id}`);

                // This would typically query an Attendance model
                return {
                    message: 'Attendance tracking coming soon',
                    studentId: id,
                    dateRange: { startDate, endDate }
                };
            } catch (error) {
                console.error('Get attendance error:', error);
                throw error;
            }
        },

        // Get student grades (placeholder)
        getGrades: async (data, res) => {
            try {
                const { id } = data;

                console.log(`Getting grades for student ${id}`);

                // This would typically query a Grade model
                return {
                    message: 'Grade tracking coming soon',
                    studentId: id
                };
            } catch (error) {
                console.error('Get grades error:', error);
                throw error;
            }
        },

        // Get student timeline
        getTimeline: async (data, res) => {
            try {
                const { id } = data;

                const student = await Student.findById(id)
                    .select('transferHistory enrollmentDate createdAt updatedAt');

                if (!student) {
                    throw new Error('Student not found');
                }

                const timeline = [
                    {
                        type: 'enrollment',
                        date: student.enrollmentDate,
                        description: 'Student enrolled'
                    }
                ];

                if (student.transferHistory) {
                    student.transferHistory.forEach(transfer => {
                        timeline.push({
                            type: 'transfer',
                            date: transfer.date,
                            description: transfer.reason || 'Transfer',
                            details: transfer
                        });
                    });
                }

                timeline.push({
                    type: 'last_updated',
                    date: student.updatedAt,
                    description: 'Profile last updated'
                });

                timeline.sort((a, b) => b.date - a.date);

                return timeline;
            } catch (error) {
                console.error('Get timeline error:', error);
                throw error;
            }
        },

        // Bulk import students
        bulkImport: async (data, res) => {
            try {
                const { students } = data;

                if (!students || !Array.isArray(students) || students.length === 0) {
                    throw new Error('Valid students array is required');
                }

                const created = [];
                const errors = [];

                for (const studentData of students) {
                    try {
                        const student = await Student.create({
                            ...studentData,
                            enrollmentDate: new Date(),
                            isActive: true
                        });
                        created.push(student);
                    } catch (error) {
                        errors.push({
                            data: studentData,
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
                console.error('Bulk import students error:', error);
                throw error;
            }
        },

        // Bulk transfer students
        bulkTransfer: async (data, res) => {
            try {
                const { studentIds, targetSchoolId, targetClassroomId, reason } = data;

                if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
                    throw new Error('Valid student IDs array is required');
                }

                if (!targetSchoolId) {
                    throw new Error('Target school ID is required');
                }

                const results = {
                    transferred: [],
                    failed: []
                };

                for (const studentId of studentIds) {
                    try {
                        const transferData = {
                            id: studentId,
                            targetSchoolId,
                            targetClassroomId,
                            reason,
                            user: data.user
                        };
                        
                        const result = await this.transfer(transferData, res);
                        results.transferred.push({
                            studentId,
                            result
                        });
                    } catch (error) {
                        results.failed.push({
                            studentId,
                            error: error.message
                        });
                    }
                }

                return results;
            } catch (error) {
                console.error('Bulk transfer students error:', error);
                throw error;
            }
        }
    };
};