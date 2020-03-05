import mongoose from 'mongoose';

export interface IGltf {
    bucketKey: string;
    contentType: string;
    location: string;
    objectId: string;
    objectKey: string;
    sha1: string;
    size: string;
}

export interface ICatalog extends mongoose.Document {
    gltf?: IGltf;
    isFile: boolean;
    isPublished?: boolean;
    name: string;
    newName?: string;
    ossDesignUrn: string;
    path: string;
    rootFilename?: string;
    size: string;
    srcDesignUrn: string;
    svfUrn?: string;
}
