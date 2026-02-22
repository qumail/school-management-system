const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    phone: {
        type: String,
        trim: true
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: [true, 'School reference is required']
    },
    classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom'
    },
    grade: {
        type: String,
        trim: true
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    transferHistory: [{
        fromSchool: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'School'
        },
        toSchool: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'School'
        },
        fromClassroom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Classroom'
        },
        toClassroom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Classroom'
        },
        date: Date,
        reason: String
    }],
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    }
}, {
    timestamps: true
});

// Index for common queries
studentSchema.index({ school: 1, classroom: 1 });
studentSchema.index({ name: 1 });

// Conditional export
if (process.env.NODE_ENV === 'test') {
    module.exports = studentSchema;
} else {
    module.exports = mongoose.model('Student', studentSchema);
}