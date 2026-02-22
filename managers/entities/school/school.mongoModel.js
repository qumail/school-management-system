const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String },
    contactEmail: { type: String },
    status: { type: String, enum: ['active','inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref:'users' }
},{ timestamps:true });


SchoolSchema.index({ name: 1 });

// Conditional export
if (process.env.NODE_ENV === 'test') {
    module.exports = SchoolSchema;
} else {
    module.exports = mongoose.model('School', SchoolSchema);
}
