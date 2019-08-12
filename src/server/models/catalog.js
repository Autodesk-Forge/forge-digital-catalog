const mongoose = require('mongoose')

const CatalogSchema = new mongoose.Schema({
    gltf: {
        bucketKey: {
            type: String
        },
        contentType: {
            type: String
        },
        location: {
            type: String
        },
        objectId: {
            type: String
        },
        objectKey: {
            type: String
        },
        sha1: {
            type: String
        },
        size: {
            type: String
        }
    },
    isFile: {
        required: 'Must specify if file or folder',
        type: Boolean
    },
    isPublished: {
        required: 'Must specify if published or not',
        type: Boolean
    },
    name: {
        required: 'Must specify a name',
        type: String
    },
    ossDesignUrn: {
        type: String
    },
    path: {
        required: 'Must specify materialized path',
        type: String
    },
    size: {
        type: String
    },
    srcDesignUrn: {
        type: String
    },
    svfUrn: { // stores SVF viewables urn
        type: String
    }
})

module.exports = Item = mongoose.model('catalog', CatalogSchema)