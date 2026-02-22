const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Classroom name is required'],
        trim: true
    },
    capacity: {
        type: Number,
        required: [true, 'Capacity is required'],
        min: [1, 'Capacity must be at least 1'],
        max: [100, 'Capacity cannot exceed 100']
    },
    grade: {
        type: String,
        trim: true
    },
    section: {
        type: String,
        trim: true
    },
    resources: [{
        type: String,
        enum: ['projector', 'smartboard', 'ac', 'computers', 'lab', 'library']
    }],
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: [true, 'School reference is required']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index to ensure unique classroom names within a school
classroomSchema.index({ school: 1, name: 1 }, { unique: true });

// Conditional export
if (process.env.NODE_ENV === 'test') {
    module.exports = classroomSchema;
} else {
    module.exports = mongoose.model('Classroom', classroomSchema);
}