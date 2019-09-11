const axios = require('axios')
const config = require('config')
const fs = require('fs')
const logger = require('koa-log4').getLogger('arvr-toolkit')
const path = require('path')

if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

axios.defaults.withCredentials = true
axios.defaults.crossDomain = true

const handleError = require('../helpers/error-handler')

const { deserialize } = require('../readers/svf')
const { getToken } = require('../helpers/auth')
const { serialize } = require('../writers/gltf')

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
async function convertToGltf(urn, guid, token, folder) {
    try {
        const viewableFolder = path.join(folder, guid)
        if (!fs.existsSync(viewableFolder)) fs.mkdirSync(viewableFolder)
        const outputFolder = path.join(viewableFolder, 'gltf')
        if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder)
        const model = await deserialize(urn, token, guid, console.log)
        serialize(model, path.join(outputFolder, 'output'))
        fs.writeFileSync(path.join(outputFolder, 'props.db'), model.propertydb) // TODO: store property db just once per URN
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
            const logfile = path.join(folder, 'output.log')
            function log(msg) { 
                fs.appendFileSync(logfile, `[${new Date().toString()}] ${msg}\n`)
            }
            const token = await getToken()
            const accessToken = token.message.access_token.replace('Bearer ', '')
            const model = await deserialize(svfUrn, accessToken, guid, log)
            logger.info(`translateSvfToGltf: model: ${model}`)
            serialize(model, path.join(folder, 'output'))
            const bytesWritten = fs.writeFileSync(path.join(folder, 'props.db'), model.propertydb) // TODO: store property db just once per URN
            if (bytesWritten) {
                ret = {
                    status: 200,
                    message: bytesWritten
                }
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
