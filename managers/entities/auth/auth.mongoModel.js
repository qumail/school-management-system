const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['superadmin', 'school_admin'],
        required: true
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: function() {
            return this.role === 'school_admin';
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Remove password when converting to JSON
userSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret.password;
        return ret;
    }
});

// Conditional export - model for normal use, schema for testing
if (process.env.NODE_ENV === 'test') {
    // In test environment, export the schema
    module.exports = userSchema;
} else {
    // In normal environment, export the model
    module.exports = mongoose.model('User', userSchema);
}