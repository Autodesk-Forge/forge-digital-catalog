const mongoose = require('mongoose')

const PublishSchema = new mongoose.Schema({
    endDate: {
        type: Date
    },
    job: {
        input: {
            designUrn: {
                required: 'Must specify design urn',
                type: String
            },
            path: {
                required: 'Must specify materialized path',
                type: String
            }
        },
        output: {
            svfUrn: String // stores SVF viewable urn
        }
    },
    name: {
        required: 'Must specify a name',
        type: String
    },
    startDate: {
        type: Date
    },
    status: {
        default: 'STARTED',
        type: String,
        required: 'Must specify status'
    },
    submittedBy: {
        required: 'Must specify user who submitted the job',
        type: String
    }
})

module.exports = mongoose.model('publishjobs', PublishSchema)