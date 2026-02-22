const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (injectable) => {
    console.log('📝 auth.manager.js initializing...');

    const { mongomodels, config } = injectable;
    // const User = mongomodels?.User;
    const User = mongomodels?.User || mongomodels?.Auth;
    const JWT_SECRET = config?.dotEnv?.JWT_SECRET || process.env.JWT_SECRET;

    if (!User) {
        console.error('❌ User model not found in auth.manager');
    }

    return {
        // Register a new user - expects data object, not req

        register: async (data, res) => {
            try {
                console.log('Registering user with data:', data);

                // Destructure from data object, not req.body
                const { email, password, name, role, schoolId } = data;

                // Validate required fields
                if (!email || !password || !name) {
                    const error = new Error('Missing required fields: email, password, name');
                    error.statusCode = 400;
                    throw error;
                }

                // Validate email format (basic validation)
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    const error = new Error('Invalid email format');
                    error.statusCode = 400;
                    throw error;
                }

                // Validate password length (minimum 6 characters)
                if (password.length < 6) {
                    const error = new Error('Password must be at least 6 characters long');
                    error.statusCode = 400;
                    throw error;
                }

                // Validate role if provided
                if (role && !['superadmin', 'school_admin'].includes(role)) {
                    const error = new Error('Invalid role. Role must be either superadmin or school_admin');
                    error.statusCode = 400;
                    throw error;
                }

                // Check if user exists
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    const error = new Error('User already exists with this email');
                    error.statusCode = 409; // Conflict
                    throw error;
                }

                // For school_admin role, validate schoolId
                const userRole = role || 'school_admin';
                if (userRole === 'school_admin') {
                    if (!schoolId) {
                        const error = new Error('School ID is required for school administrator');
                        error.statusCode = 400;
                        throw error;
                    }

                    // Validate schoolId format (MongoDB ObjectId)
                    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
                    if (!objectIdRegex.test(schoolId)) {
                        const error = new Error('Invalid school ID format');
                        error.statusCode = 400;
                        throw error;
                    }

                    // Check if school exists
                    const School = mongomodels?.School;
                    if (!School) {
                        const error = new Error('School model not available');
                        error.statusCode = 500;
                        throw error;
                    }

                    const school = await School.findById(schoolId);
                    if (!school) {
                        const error = new Error('School not found');
                        error.statusCode = 404;
                        throw error;
                    }
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Create user
                const user = await User.create({
                    email,
                    password: hashedPassword,
                    name,
                    role: userRole,
                    schoolId: userRole === 'school_admin' ? schoolId : null
                });

                // Generate token
                const token = jwt.sign(
                    {
                        userId: user._id,
                        email: user.email,
                        role: user.role,
                        schoolId: user.schoolId
                    },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return {
                    user: {
                        _id: user._id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        schoolId: user.schoolId
                    },
                    token
                };
            } catch (error) {
                console.error('Register error:', error);
                // Ensure error has statusCode
                if (!error.statusCode) {
                    error.statusCode = 500;
                }
                throw error;
            }
        },

        // Login user - expects data object, not req
        // In managers/entities/auth/auth.manager.js - update login method

        login: async (data, res) => {
            try {
                console.log('Logging in user with email:', data.email, User);

                const { email, password } = data;

                // Validate required fields
                if (!email || !password) {
                    const error = new Error('Email and password are required');
                    error.statusCode = 400;
                    throw error;
                }

                // Find user
                const user = await User.findOne({ email }).select('+password');
                console.log(user, 'USER')
                if (!user) {
                    const error = new Error('Invalid credentials');
                    error.statusCode = 401; // Unauthorized
                    throw error;
                }

                // Check if account is active
                if (user.isActive === false) {
                    const error = new Error('Account is deactivated. Please contact administrator.');
                    error.statusCode = 403; // Forbidden
                    throw error;
                }

                // Check password
                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) {
                    const error = new Error('Invalid credentials');
                    error.statusCode = 401; // Unauthorized
                    throw error;
                }

                // Update last login
                user.lastLogin = new Date();
                await user.save();

                // Generate token
                const token = jwt.sign(
                    {
                        userId: user._id,
                        email: user.email,
                        role: user.role,
                        schoolId: user.schoolId
                    },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return {
                    user: {
                        _id: user._id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        schoolId: user.schoolId
                    },
                    token
                };
            } catch (error) {
                console.error('Login error:', error);
                // Ensure error has statusCode
                if (!error.statusCode) {
                    error.statusCode = 500;
                }
                throw error;
            }
        },

        // Refresh token
        refreshToken: async (data, res) => {
            try {
                const { token } = data;

                if (!token) {
                    const error = new Error('Token required');
                    error.statusCode = 400;
                    throw error;
                }

                const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
                const user = await User.findById(decoded.userId);

                if (!user) {
                    throw new Error('User not found');
                }

                const newToken = jwt.sign(
                    {
                        userId: user._id,
                        email: user.email,
                        role: user.role,
                        schoolId: user.schoolId
                    },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return { token: newToken };
            } catch (error) {
                console.error('Refresh token error:', error);
                throw error;
            }
        },

        // Get current user
        getCurrentUser: async (data, res) => {
            try {
                const userId = data.user?.userId || data.user?.id;

                if (!userId) {
                    throw new Error('User ID not found in token');
                }

                const user = await User.findById(userId).select('-password');

                if (!user) {
                    throw new Error('User not found');
                }

                return user;
            } catch (error) {
                console.error('Get current user error:', error);
                throw error;
            }
        },

        // Logout
        logout: async (data, res) => {
            // In stateless JWT, just return success
            return { message: 'Logged out successfully' };
        },

        // Change password
        changePassword: async (data, res) => {
            try {
                const { currentPassword, newPassword } = data;
                const userId = data.user?.userId || data.user?.id;

                // Validate required fields
                if (!currentPassword || !newPassword) {
                    const error = new Error('Current password and new password are required');
                    error.statusCode = 400; // Bad Request
                    throw error;
                }

                // Validate new password length (minimum 6 characters)
                if (newPassword.length < 6) {
                    const error = new Error('New password must be at least 6 characters long');
                    error.statusCode = 400; // Bad Request
                    throw error;
                }

                // Check if user exists
                const user = await User.findById(userId).select('+password');
                if (!user) {
                    const error = new Error('User not found');
                    error.statusCode = 401; // Unauthorized - User not found
                    throw error;
                }

                // Verify current password
                const isValid = await bcrypt.compare(currentPassword, user.password);
                if (!isValid) {
                    const error = new Error('Current password is incorrect');
                    error.statusCode = 401; // Unauthorized - Wrong password
                    throw error;
                }

                // Hash new password
                user.password = await bcrypt.hash(newPassword, 10);
                await user.save();

                // Return success with 201 Created status
                return {
                    message: 'Password updated successfully'
                };
            } catch (error) {
                console.error('Change password error:', error);
                // Ensure error has statusCode
                if (!error.statusCode) {
                    error.statusCode = 500; // Internal Server Error
                }
                throw error;
            }
        }
    };
};