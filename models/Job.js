const mongoose = require('mongoose')


const JobSchema = new mongoose.Schema(
    {
        company: {
            type: String,
            required: [true, 'Provide company name'],
            maxlength: 50,
        },
        position: {
            type: String,
            required: [true, 'Provide position'],
            maxlength: 50,
        },
        status: {
            type: String,
            enum: ['interview', 'declined', 'pending'],
            default: 'pending',
        },
        createdBy: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: [true, 'Provide user'],
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Job', JobSchema)
