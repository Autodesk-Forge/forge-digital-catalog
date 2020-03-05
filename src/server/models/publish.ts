import { model, Schema } from 'mongoose';
import { IPublishJob } from '../../shared/publish';

const PublishSchema: Schema = new Schema({
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
            svfUrn: String
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
        required: 'Must specify status',
        type: String
    },
    submittedBy: {
        required: 'Must specify user who submitted the job',
        type: String
    }
});

export default model<IPublishJob>('publishjobs', PublishSchema);
