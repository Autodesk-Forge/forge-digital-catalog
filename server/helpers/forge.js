const axios = require('axios')
const config = require('config')
const logger = require('koa-log4').getLogger('forge')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

const handleError = require('./handle-error')

/**
 * Retrieve manifest JSON
 * @param {*} urn 
 * @param {*} token 
 * @param {*} retry 
 */
async function getManifest(urn, token, retry = 0) {
    try {
        let url
        switch (config.get('region')) {
            case 'US':
            url = `${config.get('API_derivative_host')}/designdata/${urn}/manifest`
            break
        case 'EMEA':
            url = `${config.get('API_derivative_host')}/regions/eu/designdata/${urn}/manifest`
            break
        default:
            url = `${config.get('API_derivative_host')}/designdata/${urn}/manifest`
        }
        const res = await axios({
            headers: {
              Authorization: `Bearer ${token}`
            },
            method: 'GET',
            url
        })
        if (res.status !== 200) {
            throw new Error(res.data)
        }
        return res.data
    } catch (err) {
        if (retry < 3) {
            await getManifest(urn, token, retry + 1)
          }
        return handleError(err)
    }
}

/**
 * Retrieve the derivatives
 * @param {*} urn 
 * @param {*} token 
 * @param {*} retry 
 */
async function getDerivative(urn, token, retry = 0) {
    try {
        const res = await axios({
            headers: {
              Authorization: `Bearer ${token}`
            },
            method: 'GET',
            responseType: 'arraybuffer',
            url: `${config.get('API_derivative_service')}/derivatives/${urn}`
        })
        if (res.status !== 200) {
            const message = await res.data.text()
            throw new Error(message)
        }
        const buffer = Buffer.from(res.data, 'null')
        return buffer
    } catch (err) {
        if (retry < 3) {
            await getDerivative(urn, token, retry + 1)
          }
        return handleError(err)
    }
}

/**
 * Traverse the manifest JSON data
 * @param {*} node 
 * @param {*} callback 
 */
function traverseManifest(node, callback) {
    callback(node)
    if (node.derivatives) {
        for (const child of node.derivatives) {
            traverseManifest(child, callback)
        }
    } else if (node.children) {
        for (const child of node.children) {
            traverseManifest(child, callback)
        }
    }
}

module.exports = {
    getManifest,
    getDerivative,
    traverseManifest
}
