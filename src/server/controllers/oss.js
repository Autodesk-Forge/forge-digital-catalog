const axios = require('axios')
const logger = require('koa-log4').getLogger('oss')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

axios.defaults.withCredentials = true
axios.defaults.crossDomain = true

const handleError = require('../helpers/error-handler')

const config = require('config')

const { getToken } = require('../helpers/auth')

let ret = {
  status: 520,
  message: 'Unknown Error'
}

/**
 * Downloads an object from OSS
 * @param {*} bucketKey 
 * @param {*} objectKey 
 * @param {*} retry 
 */
async function downloadObject(bucketKey, objectKey, retry = 0) {
    try {
        const token = await getToken()
        const res = await axios({
            headers: {
              Authorization: `Bearer ${token.message.access_token}`
            },
            method: 'GET',
            responseType: 'arraybuffer',
            url: `${config.get('API_oss_host')}/buckets/${bucketKey}/objects/${objectKey}`
          })
          if (res.status === 200 || res.status === 206) {
            const buffer = Buffer.from(res.data, 'null')
            ret = {
              status: res.status,
              message: buffer
            }
          }
          return ret
    } catch (err) {
        if (retry < 3) {
            await downloadObject(bucketKey, objectKey, retry++)
          }
          return handleError(err)
    }
}

// add the methods to the module export
module.exports = {
    downloadObject
  }