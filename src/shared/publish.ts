import mongoose from 'mongoose';

export interface IInput {
    designUrn: string;
    path: string;
}

export interface IOutput {
    svfUrn: string;
}

export interface IJob {
    input: IInput;
    output: IOutput;
}

export interface IPublishJob extends mongoose.Document {
    endDate: Date;
    job: IJob;
    name: string;
    startDate: Date;
    status: string;
    submittedBy: string;
}

export interface IXRef {
    children?: IXRef[];
    extension: string;
    fileType: string;
    id?: string;
    location: string;
    name: string;
    type: string;
}
