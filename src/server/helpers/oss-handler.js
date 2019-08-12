const axios = require('axios')
const config = require('config')
const fs = require('fs')
const handleError = require('./error-handler')
const logger = require('koa-log4').getLogger('oss-handler')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }
const util = require('util')

const Token = require('../auth/token')

let ret = {
  status: 520,
  message: 'Unknown Error'
}

/**
 * Create OSS Bucket
 * @param {} token 
 * @param {*} bucketKey 
 * @param {*} retry 
 */
async function createBucket(token, bucketKey, retry = 0) {
    try {
      const res = await axios({
        data: {
          bucketKey,
          policyKey: 'persistent'
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-ads-region': config.get('region')
        },
        method: 'POST',
        url: `${config.get('API_oss_host')}/buckets`
      })
      if (res.status === 200 || res.status === 206) {
        ret = {
          status: res.status,
          message: res.data
        }
      }
      return ret
    } catch (err) {
      if (retry < 3) {
        await createBucket(token, bucketKey, retry++)
      }
      return handleError(err)
    }
}

/**
 * Download Object
 * From OSS bucket
 * @param {*} session 
 * @param {*} bucketKey 
 * @param {*} objectName 
 * @param {*} retry 
 */
async function downloadObject(session, bucketKey, objectName, srcFileName, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      responseType: 'arraybuffer',
      url: `${config.get('API_oss_host')}/buckets/${bucketKey}/objects/${objectName}`
    })
    if (res.status === 200 || res.status === 206) {
      const buffer = Buffer.from(res.data, 'null')
      const outputFile = `/tmp/${srcFileName}`
      const writeFile = util.promisify(fs.writeFile)
      const tmpFile = await writeFile(outputFile, buffer)
      if (tmpFile) {
        ret = {
          status: res.status,
          message: res.data
        }
      }
    }
    return ret
  } catch (err) {
    if (retry < 3) {
      await downloadObject(session, bucketKey, objectName, srcFileName, retry++)
    }
    return handleError(err)
  }
}

/**
 * Get Bucket Details
 * @param {*} token 
 * @param {*} bucketKey 
 * @param {*} retry 
 */
async function getBucketInfo(token, bucketKey, retry = 0) {
    try {
      const res = await axios({
        headers: {
          Authorization: `Bearer ${token}`
        },
        method: 'GET',
        timeout: config.get('axios_timeout'),
        url: `${config.get('API_oss_host')}/buckets/${bucketKey}/details`
      })
      if (res.status === 200) {
        ret = {
          status: 200,
          message: res.data
        }
      }
      return ret
    } catch (err) {
      if (retry < 3) {
        if (err.response.status === 404) {
          ret = {
            status: err.response.status,
            message: err.response.message
          }
          return ret
        }
        await getBucketInfo(token, bucketKey, retry++)
      }
      return handleError(err)
    }
}  

module.exports = {
    createBucket,
    downloadObject,
    getBucketInfo
}

