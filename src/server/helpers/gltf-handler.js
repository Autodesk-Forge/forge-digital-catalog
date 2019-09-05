const arraybufferEqual = require('arraybuffer-equal')
const deepEqual = require('deep-equal')
const fs = require('fs')
const handleError = require('./error-handler')
const logger = require('koa-log4').getLogger('gltf-handler')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }
const path = require('path')

const dedupeAccessors = true
var gltfFilePath

const WEBGL_TYPE_SIZES = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4,
    'MAT2': 4,
    'MAT3': 9,
    'MAT4': 16
}
  
const WEBGL_COMPONENT_TYPES = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
}

async function dedupe (buffers) {
    try {
        const basePath = path.dirname(gltfFilePath)
        const inFile = path.basename(gltfFilePath)
        const gltf = JSON.parse(fs.readFileSync(gltfFilePath, 'utf8'))
        logger.info(`Buffer count: ${buffers.length}`)
        // retrieve views
        const bufferViewWrappers = gltf.bufferViews.map(bufferView => {
            const buffer = buffers[bufferView.buffer]
            const byteLength = bufferView.byteLength || 0
            const bVByteOffset = bufferView.byteOffset || 0
            const data = buffer.slice(bVByteOffset, bVByteOffset + byteLength)
            if (data.byteLength !== byteLength) {
                throw new Error('mismatch byteLength')
            }
            return {
                bufferView,
                data
            }
        })
        logger.info(`Buffer views before processing: ${bufferViewWrappers.length}`)
        const oldByteLength = buffers.reduce((sum, b) => {
            return b.byteLength + sum
        }, 0)
        logger.info(`Old byte length: ${oldByteLength}`)
        // a lookup from old bufferView index to new index
        const bufferViewLookup = []
        // a collection of unique buffer views
        const uniqueWrappers = []
        // find duplicates
        bufferViewWrappers.forEach((wrapper, originalIndex) => {
            let newIndex = uniqueWrappers.findIndex(other => isBufferViewWrapperEqual(wrapper, other))
            if (newIndex === -1) {
                // we found a new buffer, let's add it to our unique list
                newIndex = uniqueWrappers.length
                uniqueWrappers.push(wrapper)
            }
            bufferViewLookup[originalIndex] = newIndex
        })
        logger.info(`Buffer views after processing: ${uniqueWrappers.length}`)
        if (uniqueWrappers.length === bufferViewWrappers.length) {
            logger.info('No shared data, resolving immediately.')
            return Promise.resolve()
        }
        // Now we go through each accessor and fix the indices
        gltf.accessors.forEach(accessor => {
            if (accessor.sparse) {
                throw new Error('sparse accessors not supported yet')
            }
            accessor.bufferView = bufferViewLookup[accessor.bufferView]
        })
        const outputBytes = []
        let byteOffset = 0
        uniqueWrappers.forEach(w => {
            const newData = new DataView(w.data)
            const byteLength = w.bufferView.byteLength
            // override byte offset
            w.bufferView.byteOffset = byteOffset
            if (byteLength !== w.data.byteLength) {
                throw new Error('glTF data byteLength does not match real byteLength')
            }
            for (let i = 0; i < byteLength; i++) {
                const byte = newData.getUint8(i)
                outputBytes.push(byte)
            }
            byteOffset += byteLength
            while (byteOffset % 4 !== 0) {
                outputBytes.push(0)
                byteOffset++
            }
        })
        const outputBuffer = new Uint8Array(outputBytes)
        const outputArrayBuffer = outputBuffer.buffer
        logger.info(`New byte length: ${outputBuffer.byteLength}`)
        // replace old bufferViews with new bufferViews
        gltf.bufferViews = uniqueWrappers.map((w, i) => {
            // New index is zero since we will just use a single output buffer
            return Object.assign(w.bufferView, { buffer: 0 })
        })
        const outGLTFName = `${path.basename(inFile, path.extname(inFile))}-optimized${path.extname(inFile)}`
        const outBinName = `${path.basename(inFile, path.extname(inFile))}-optimized.bin`
        // rewrite output buffer
        gltf.buffers = [
            { byteLength: outputBuffer.byteLength, uri: outBinName }
        ]
        // Now deduplicate the accessors ...
        if (dedupeAccessors) {
            const accessorWrappers = toAttributeWrappers([ outputArrayBuffer ], gltf.bufferViews, gltf.accessors)
            logger.info(`Total accessors: ${accessorWrappers.length}`)
            const uniqueAccessors = []
            const accessorLookup = []
            // find duplicates
            accessorWrappers.forEach((wrapper, originalIndex) => {
                let newIndex = uniqueAccessors.findIndex(other => isAccessorWrapperEqual(wrapper, other))
                if (newIndex === -1) {
                    // we found a new buffer, let's add it to our unique list
                    newIndex = uniqueAccessors.length
                    uniqueAccessors.push(wrapper)
                }
                accessorLookup[originalIndex] = newIndex
            })
            logger.info(`Unique accessors: ${uniqueAccessors.length}`)
            gltf.meshes.forEach(mesh => {
                mesh.primitives.forEach(primitive => {
                    if (typeof primitive.indices !== 'undefined') {
                        primitive.indices = accessorLookup[primitive.indices]
                    }
                    if (primitive.attributes) {
                        Object.keys(primitive.attributes).forEach(key => {
                            const oldIndex = primitive.attributes[key]
                            primitive.attributes[key] = accessorLookup[oldIndex]
                        })
                    }
                })
            })
            // override unique accessors
            gltf.accessors = uniqueAccessors.map(w => w.accessor)
        }
        const outGLTF = path.resolve(basePath, outGLTFName)
        const outBin = path.resolve(basePath, outBinName)
        fs.writeFile(outGLTF, JSON.stringify(gltf, undefined, 2), gltfErr => {
            if (gltfErr) throw gltfErr
            fs.writeFile(outBin, Buffer.from(outputBuffer), binErr => {
                if (binErr) throw binErr
            })
        })
    } catch (err) {
        logger.error(err)
    }
}

function isAccessorWrapperEqual (wrapperA, wrapperB) {
    const a = wrapperA.accessor
    const b = wrapperB.accessor
    if (a.byteOffset !== b.byteOffset) return false
    if (a.componentType !== b.componentType) return false
    if (a.normalized !== b.normalized) return false
    if (a.type !== b.type) return false
    if (a.count !== b.count) return false
    if (!deepEqual(a.max, b.max)) return false
    if (!deepEqual(a.min, b.min)) return false
    if (!deepEqual(a.sparse, b.sparse)) return false
    if (!deepEqual(a.extensions, b.extensions)) return false
    if (!deepEqual(a.extras, b.extras)) return false
    if (wrapperA.data.byteLength !== wrapperB.data.byteLength) return false
    return arraybufferEqual(wrapperA.data.buffer, wrapperB.data.buffer)
}

function isBufferViewWrapperEqual (a, b) {
    if (a.bufferView.byteStride !== b.bufferView.byteStride) return false
    if (a.bufferView.target !== b.bufferView.target) return false
    if (a.data.byteLength !== b.data.byteLength) return false
    if ((a.bufferView.extras || b.bufferView.extras) && !deepEqual(a.bufferView.extras, b.bufferView.extras)) return false
    if ((a.bufferView.extensions || b.bufferView.extensions) && !deepEqual(a.bufferView.extensions, b.bufferView.extensions)) return false
    return arraybufferEqual(a.data, b.data)
}

function loadBuffer (bufferData, bufferIndex, basePath) {
    if (bufferData.uri === undefined && bufferIndex === 0) {
        throw new Error('glb not supported yet')
    }
    const url = resolveURL(bufferData.uri, basePath)
    const dataUriRegex = /^data:(.*?)(;base64)?,(.*)$/
    const dataUriRegexResult = url.match(dataUriRegex)
    if (dataUriRegexResult) {
        throw new Error('not yet supported embedded buffers')
    }
    return new Promise((resolve, reject) => {
        fs.readFile(url, (err, data) => {
            if (err) return reject(err)
            const buf = toArrayBuffer(data)
            resolve(buf)
        })
    })
}

/**
 * Optimizes glTF file
 * https://gist.github.com/mattdesl/aea40285e2d73916b6b9101b36d84da8
 * @param {*} filePath 
 */
async function optimizeGltf(filePath) {
    try {
        gltfFilePath = filePath
        const gltf = JSON.parse(fs.readFileSync(gltfFilePath, 'utf8'))
        const basePath = path.dirname(gltfFilePath)
        const bufferData = gltf.buffers
        const buffers = await Promise.all(bufferData.map((b, i) => loadBuffer(b, i, basePath)))
        await dedupe(buffers)
    } catch (err) {
        return handleError(err)
    }
}

function resolveURL(url, basePath) {
    // Invalid URL
    if (typeof url !== 'string' || url === '') {
        throw new Error('invalid URL string')
    }
    // Absolute URL http://,https://,//
    if (/^(https?:)?\/\//i.test(url)) {
        throw new Error('https URL not supported')
    }
    // Data URI
    if (/^data:.*,.*$/i.test(url)) {
        return url
    }
    // Blob URL
    if (/^blob:.*$/i.test(url)) {
        throw new Error('blob URL not supported')
    }
    // Relative URL
    return path.resolve(basePath, url)
}

function toArrayBuffer (buf) {
    var ab = new ArrayBuffer(buf.length)
    var view = new Uint8Array(ab)
    for (var i = 0; i < buf.length; ++i) {
      view[i] = buf[i]
    }
    return ab
}

function toAttributeWrappers (buffers, bufferViews, accessors) {
    // retrieve views
    const wrappers = bufferViews.map(bufferView => {
        const buffer = buffers[bufferView.buffer]
        const byteLength = bufferView.byteLength || 0
        const byteOffset = bufferView.byteOffset || 0
        const data = buffer.slice(byteOffset, byteOffset + byteLength)
        if (data.byteLength !== byteLength) throw new Error('mismatch byteLength')
        return {
            data,
            bufferView
        }
    })
    return accessors.map(accessor => {
        var bufferView = wrappers[accessor.bufferView].data
        var itemSize = WEBGL_TYPE_SIZES[accessor.type]
        var TypedArray = WEBGL_COMPONENT_TYPES[accessor.componentType]
        // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
        var elementBytes = TypedArray.BYTES_PER_ELEMENT
        var itemBytes = elementBytes * itemSize
        var byteStride = 0
        /* var normalized = accessor.normalized === true */
        // The buffer is not interleaved if the stride is the item size in bytes.
        if (byteStride && byteStride !== itemBytes) {
            throw new Error('Stride not yet supported!')
        } else {
            return {
                accessor,
                data: new TypedArray(bufferView, accessor.byteOffset, accessor.count * itemSize)
            }
        }
    })
}

module.exports = {
    optimizeGltf
}