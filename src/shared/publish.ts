import mongoose from 'mongoose';

export interface IInput {
    designUrn: string;
    path?: string;
}

export interface IOutput {
    svfUrn: string;
}

export interface IJob {
    input?: IInput;
    output?: IOutput;
}

export interface IDerivativeChild {
    urn: string;
    role: string;
    mime: string;
    guid: string;
    type: string;
    resolution?: number[];
    status?: string;
}

export interface IDerivative {
    hasThumbnail: boolean;
    children: IDerivativeChild[];
    name: string;
    progress: string;
    outputType: string;
    status: string;
}

export interface IManifest {
    urn: string;
    derivatives: IDerivative[];
    hasThumbnail: boolean;
    progress: string;
    type: string;
    region: string;
    version: string;
    status: string;
}

export interface IMoveJob {
    fileType?: string;
    name?: string;
    projectId?: string;
    refs: IXRef[];
    storageLocation?: string;
    versionId?: string;
}

export interface IPublishJob extends mongoose.Document {
    endDate?: Date;
    job: IJob;
    name?: string;
    startDate?: Date;
    status?: string;
    submittedBy?: string;
}

export interface ITranslateJob {
    input: {
        compressedUrn: string;
        urn: string;
        rootFilename: string;
    };
    misc: {
        workflow: string;
        workflowAttribute: any;
    };
    output: {
        destination: {
            region: string;
        };
        formats: {
            type: string;
            views: string[];
        };
    };
}

export interface ITranslateJobResult {
    result: string;
    urn: string;
    acceptedJobs: {
        output: {
            destination: {
                region: string;
            };
            formats: [
                {
                    type: string;
                    views: string[];
                }
            ];
        };
    };
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
