const axios = require('axios')
const config = require('config')
const fs = require('fs')
const logger = require('koa-log4').getLogger('arvr-toolkit')
const path = require('path')

if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

axios.defaults.withCredentials = true
axios.defaults.crossDomain = true

const handleError = require('../helpers/error-handler')

const { getFeatureToggles } = require('./admin')
const { getToken } = require('../helpers/auth')

const { ModelDerivativeClient, ManifestHelper } = require('forge-server-utils')
const { SvfReader, GltfWriter } = require('forge-convert-utils')

let ret = {
  status: 520,
  message: 'Unknown Error'
}

/**
 * Convert Viewables
 * @param {*} urn 
 * @param {*} guid 
 * @param {*} token 
 * @param {*} folder 
 */
async function convertToGltf(urn, guid, folder) {
    try {
        const viewableFolder = path.join(folder, guid)
        if (!fs.existsSync(viewableFolder)) fs.mkdirSync(viewableFolder)
        const outputFolder = path.join(viewableFolder, 'gltf')
        if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder)
        const auth = {
            client_id: config.get('oauth2.clientID'),
            client_secret: config.get('oauth2.clientSecret')
        }
        const modelDerivativeClient = new ModelDerivativeClient(auth)
        const helper = new ManifestHelper(await modelDerivativeClient.getManifest(urn))
        const derivatives = helper.search({ type: 'resource', role: 'graphics' })
        const featureToggles = await getFeatureToggles()
        if (
            featureToggles.status === 200 
            && featureToggles.message[0].featureToggles.arvr_toolkit
            ) {
                const options = {
                    binary: featureToggles.message[0].featureToggles.gltf_binary_output,
                    compress: featureToggles.message[0].featureToggles.gltf_draco_compression,
                    deduplicate: featureToggles.message[0].featureToggles.gltf_deduplication,
                    skipUnusedUvs: featureToggles.message[0].featureToggles.gltf_skip_unused_uvs,
                    log: (msg) => logger.info('Writer', msg) 
                } // need to add sqlite option
                if (!fs.existsSync(path.join(outputFolder, 'output'))) fs.mkdirSync(path.join(outputFolder, 'output'))
                const writer = new GltfWriter(path.join(outputFolder, 'output'), options)
                for (const derivative of derivatives.filter(d => d.mime === 'application/autodesk-svf')) {
                    const reader = await SvfReader.FromDerivativeService(urn, derivative.guid, auth)
                    const metadata = await reader.getMetadata()
                    fs.writeFileSync(path.join(outputFolder, 'output', 'metadata.json'), JSON.stringify(metadata)) // helps capture units
                    const svf = await reader.read()
                    writer.write(svf)
                }
                await writer.close()
        }
    } catch (err) {
        return handleError(err)
    }
}

/**
 * Create new folders to store the glTF files
 * @param {*} folder 
 */
function createFolders(folder) {
    folder.split('/').reduce((accumulator, current) => {
        if (accumulator && !fs.existsSync(accumulator)) {
            fs.mkdirSync(accumulator)
        }
        return `${accumulator}/${current}`
    })
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder)
    }
}

/**
 * Find viewables
 * @param {*} manifest 
 * @param {*} mime 
 */
function findViewables(manifest, mime) {
    function traverse(node, callback) {
        callback(node)
        node.derivatives && node.derivatives.forEach(child => traverse(child, callback))
        node.children && node.children.forEach(child => traverse(child, callback))
    }
    let viewables = []
    traverse(manifest, function(node) { if (node.mime === mime) viewables.push(node) })
    return viewables
}

/**
 * List all files available for a 3D viewable GUID
 * @param {*} svfUrn 
 * @param {*} guid 
 * @param {*} retry 
 */
function get3DViewableFilesByGuid(svfUrn, guid, retry = 0) {
    try {
        const folder = path.join(__dirname, 'cache', svfUrn, guid)
        if (fs.existsSync(folder)) {
            ret = {
                status: 200,
                message: JSON.stringify(fs.readdirSync(folder))
            }
        } else {
            ret = {
                status: 404,
                message: 'Folder Not Found'
            }
        }
        return ret
    } catch (err) {
        retry++
        if (retry < 3) {
            get3DViewableFilesByGuid(svfUrn, guid, retry)
        }
        return handleError(err)
    }
}

/**
 * Returns raw data of a specific resource of a 3D viewable GUID
 * @param {*} svfUrn 
 * @param {*} guid 
 * @param {*} resource 
 * @param {*} retry 
 */
function get3DViewableResourceByGuid(svfUrn, guid, resource, retry = 0) {
    try {
        const folder = path.join(__dirname, 'cache', svfUrn, guid)
        const file = path.join(folder, resource)
        if (fs.existsSync(file)) {
            ret = {
                status: 200,
                message: res.data
            }
        } else {
            ret = {
                status: 404,
                message: 'File Not Found'
            }
        }
        return ret
    } catch (err) {
        retry++
        if (retry < 3) {
            get3DViewableResourceByGuid(svfUrn, guid, resource, retry)
        }
        return handleError(err)
    }
}

/**
 * List GUIDs of all 3D viewables in an URN
 * @param {*} svfUrn 
 * @param {*} retry 
 */
async function get3DViewablesGuids(svfUrn, retry = 0) {
    try {
        const token = await getToken()
        const res = await axios({
            headers: {
                Authorization: `Bearer ${token.message.access_token}`
              },
              method: 'GET',
              url: `${config.get('API_derivative_host')}/designdata/${svfUrn}/manifest`
        })
        if (res.status === 200) {
            ret = {
                status: res.status,
                message: JSON.stringify(findViewables(res.data, 'application/autodesk-svf').map(viewable => viewable.guid))
            }
        }
        return ret
    } catch (err) {
        retry++
        if (retry < 3) {
            await get3DViewablesGuids(svfUrn, retry)
        }
        return handleError(err)
    }
}

/**
 * Trigger SVF-to-glTF translation if the output is not yet available
 * @param {*} svfUrn 
 * @param {*} guid 
 * @param {*} retry 
 */
async function translateSvfToGltf(svfUrn, guid, retry = 0) {
    try {
        const folder = path.join('/tmp/cache', svfUrn, guid)
        if (!fs.existsSync(folder)) {
            createFolders(folder)
            const auth = {
                client_id: config.get('oauth2.clientID'),
                client_secret: config.get('oauth2.clientSecret')
            }
            const modelDerivativeClient = new ModelDerivativeClient(auth)
            const helper = new ManifestHelper(await modelDerivativeClient.getManifest(svfUrn))
            const derivatives = helper.search({ type: 'resource', role: 'graphics' })
            if (!fs.existsSync(path.join(folder, 'output'))) fs.mkdirSync(path.join(folder, 'output'))
            const writer = new GltfWriter(path.join(folder, 'output'))
            for (const derivative of derivatives.filter(d => d.mime === 'application/autodesk-svf')) {
                const reader = await SvfReader.FromDerivativeService(svfUrn, derivative.guid, auth)
                const metadata = await reader.getMetadata()
                fs.writeFileSync(path.join(folder, 'output', 'metadata.json'), JSON.stringify(metadata)) // helps capture units
                const svf = await reader.read()
                writer.write(svf)
            }
            writer.close()
            ret = {
                status: 200,
                message: 'glTF output created.'
            }
        } else {
            retry = 3
            ret = {
                status: 200,
                message: 'glTF output already exists.'
            }
        }
        return ret
    } catch (err) {
        retry++
        if (retry < 3) {
            await translateSvfToGltf(svfUrn, guid, retry)
        }
        return handleError(err)
    }
}

// add the methods to the module export
module.exports = {
    convertToGltf,
    get3DViewableFilesByGuid,
    get3DViewableResourceByGuid,
    get3DViewablesGuids,
    translateSvfToGltf
}
