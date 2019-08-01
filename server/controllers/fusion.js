const archiver = require('archiver')
const axios = require('axios')
const fs = require('fs')
const logger = require('koa-log4').getLogger('fusion')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }
const path = require('path')
const url = require('url')
const util = require('util')

axios.defaults.withCredentials = true
axios.defaults.crossDomain = true

const handleError = require('../helpers/handle-error')
const Token = require('../auth/token')

const config = require('config')

const { getFileFormatToggles } = require('./admin')
const { getToken } = require('./auth')

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
      await createBucket(token, bucketKey, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Download the File
 * NOTE: This mechanism can download the Fusion references
 * and have information about the references
 * @param {*} session 
 * @param {*} projectId 
 * @param {*} versionId 
 * @param {*} retry 
 */
async function downloadFile(session, projectId, versionId, fileType, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const payload = {
      jsonapi: {
        version: '1.0'
      },
      data: {
        type: 'downloads',
        attributes: {
          format: {
            fileType
          }
        },
        relationships: {
          source: {
            data: {
              type: 'versions',
              id: versionId
            }
          }
        }
      }
    }
    const res = await axios({
      data: payload,
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`,
        'Content-Type': 'application/vnd.api+json'
      },
      method: 'POST',
      timeout: config.axios_long_timeout,
      url: `${config.get('API_data_host')}/projects/${projectId}/downloads`
    })
    if (res.status === 202) {
      ret = {
        status: 202,
        message: res.data
      }
    }
    return ret
  } catch (err) {
    if (retry < 3) {
      await downloadFile(session, projectId, versionId, fileType, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Returns a collection of supported file formats
 * this version could be converted to and downloaded as
 * @param {*} session 
 * @param {*} projectId 
 * @param {*} versionId 
 * @param {*} retry 
 */
async function downloadFormats(session, projectId, versionId, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.axios_timeout,
      url: `${config.get('API_data_host')}/projects/${projectId}/versions/${encodeURIComponent(versionId)}/downloadFormats`
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
      await downloadFormats(session, projectId, versionId, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Download CAD reference files
 * @param {*} payload 
 * @param {*} retry 
 */
async function downloadCADReferences(session, payload, retry = 0) {
  try {
    const downloadPromises = await Promise.all(payload.refs.map(async ref => {
      const refBucketKey = ref.location.split('/')[0].split(':')[3]
      const refObjectName = ref.location.split('/')[1]
      const srcFileName = ref.name
      const downloadRefPromise = await downloadObject(session, refBucketKey, refObjectName, srcFileName)
      if( downloadRefPromise.status === 200) {
        if (ref.hasOwnProperty('children') && ref.children.length > 0) {
          let childPayload = {}
          childPayload.refs = ref.children
          await downloadCADReferences(session, childPayload, retry = 0)
        }
        return downloadRefPromise
      }
    }))
    return downloadPromises
  } catch (err) {
    if (retry < 3) {
      await downloadCADReferences(session, payload, retry + 1)
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
      await downloadObject(session, bucketKey, objectName, srcFileName, retry + 1)
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
      await getBucketInfo(token, bucketKey, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Returns the details for a specific download
 * @param {*} session 
 * @param {*} projectId 
 * @param {*} downloadId 
 * @param {*} retry 
 */
async function getDownloadInfo(session, projectId, downloadId, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.axios_timeout,
      url: `${config.get('API_data_host')}/projects/${projectId}/downloads/${downloadId}`
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
      await getDownloadInfo(session, projectId, downloadId, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Returns Download Job Information
 * @param {*} session 
 * @param {*} projectId 
 * @param {*} jobId 
 * @param {*} retry 
 */
async function getDownloadJobInfo(session, href, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.axios_timeout,
      url: href
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
      await getDownloadJobInfo(session, href, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Retrieve folder content
 * @param {*} session 
 * @param {*} projectId 
 * @param {*} folderId 
 * @param {*} retry 
 */
async function getFolderContents(session, projectId, folderId, retry = 0) {
  try {
    const tokenSession = new Token(session)
    // Retrieve file format toggles
    const fileFormats = await getFileFormatToggles()
    let filters = 'folders:autodesk.core:Folder'
    if (fileFormats.status === 200) {
      if (fileFormats.message[0].fileFormatToggles.fusion) {
        filters += ',items:autodesk.fusion360:Design'
      }
      if (fileFormats.message[0].fileFormatToggles.inventor 
        || fileFormats.message[0].fileFormatToggles.navisworks
        || fileFormats.message[0].fileFormatToggles.revit) {
        filters += ',items:autodesk.core:File'
      }
    }
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.axios_timeout,
      url: `${config.get('API_data_host')}/projects/${projectId}/folders/${folderId}/contents?filter[extension.type]=${filters}`
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
      await getFolderContents(session, projectId, folderId, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Retrieves Hubs
 * @param {*} session 
 * @param {*} retry 
 */
async function getHubs(session, retry = 0) {
  try {
    const tokenSession = new Token(session)
    if (!tokenSession._session.passport) {
      logger.error('... Found empty passport session')
      throw new Error('Found empty passport session')
    }
    // Limit to A360 Teams hubs only (no personal of BIM360 hubs allowed)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.get('axios_timeout'),
      url: `${config.get('API_project_host')}/hubs?filter[extension.type]=hubs:autodesk.core:Hub`
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
      await getHubs(session, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Retrieve Information about the Item Version
 * @param {*} session 
 * @param {*} projectId 
 * @param {*} versionId 
 * @param {*} retry 
 */
async function getItemVersionInfo(session, projectId, versionId, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.axios_timeout,
      url: `${config.get('API_data_host')}/projects/${projectId}/versions/${encodeURIComponent(versionId)}`
    })
    if (res.status === 200) {
      ret = {
        status: 200,
        message: {
          derivativeUrn: res.data.data.relationships.derivatives.data.id,
          designUrn: res.data.data.id,
          fileType: (res.data.data.attributes.fileType) ? res.data.data.attributes.fileType: res.data.data.attributes.extension.type,
          name: res.data.data.attributes.displayName,
          size: res.data.data.attributes.storageSize,
          storageLocation: res.data.data.relationships.storage.data.id
        }
      }
    }
    return ret
  } catch (err) {
    if (retry < 3) {
      await getItemVersionInfo(session, projectId, versionId, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Retrieves item's versions
 * @param {*} session 
 * @param {*} projectId 
 * @param {*} itemId 
 * @param {*} retry 
 */
async function getItemVersions(session, projectId, itemId, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.axios_timeout,
      url: `${config.get('API_data_host')}/projects/${projectId}/items/${itemId}/versions`
    })
    if (res.status === 200) {
      ret = {
        status: 200,
        message: res.data.data
      }
    }
    return ret
  } catch (err) {
    if (retry < 3) {
      await getItemVersions(session, projectId, itemId, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Get Mime Type
 * @param {*} filename 
 */
function getMimeType(filename) {
  const regexp = /(?:\.([^.]+))?$/ // regexp to extract file extension
  const extension = regexp.exec(filename)[1]
  const types = {
    'png': 'application/image',
    'jpg': 'application/image',
    'txt': 'application/txt',
    'ipt': 'application/vnd.autodesk.inventor.part',
    'iam': 'application/vnd.autodesk.inventor.assembly',
    'dwf': 'application/vnd.autodesk.autocad.dwf',
    'dwg': 'application/vnd.autodesk.autocad.dwg',
    'f3d': 'application/vnd.autodesk.fusion360',
    'f2d': 'application/vnd.autodesk.fusiondoc',
    'nwd': 'application/vnd.autodesk.navisworks',
    'rvt': 'application/vnd.autodesk.revit',
    'zip': 'application/zip'
  }
  return (types[extension] != null ? types[extension] : 'application/' + extension)
}

/**
 * Get Project Information
 * @param {*} session 
 * @param {*} hubId 
 * @param {*} projectId 
 * @param {*} retry 
 */
async function getProject(session, hubId, projectId, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.axios_timeout,
      url: `${config.get('API_project_host')}/hubs/${hubId}/projects/${projectId}`
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
      await getProject(session, hubId, projectId, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Retrieves Projects for a specific Hub
 * @param {Re} session 
 * @param {*} hubId 
 * @param {*} retry 
 */
async function getProjects(session, hubId, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.axios_long_timeout,
      url: `${config.get('API_project_host')}/hubs/${hubId}/projects`
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
      await getProjects(session, hubId, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Returns thumbnail data URI
 * @param {*} urn 
 * @param {*} retry 
 */
async function getThumbnail(urn, retry = 0) {
  try {
    const twoLeggedToken = await getToken('viewer')
    const res = await axios({
      headers: {
        Authorization: `Bearer ${twoLeggedToken.message.access_token}`
      },
      method: 'GET',
      responseType: 'arraybuffer',
      url: `${config.get('API_derivative_host')}/designdata/${urn}/thumbnail?width=100&height=100`
    })
    if (res.status === 200) {
      const b64Encoded = Buffer.from(res.data, 'binary').toString('base64')
      const dataUri = `data:image/png;base64,${b64Encoded}`
      ret = {
        status: 200,
        message: dataUri
      }
    }
    return ret
  } catch (err) {
    if (retry < 3) {
      await getThumbnail(urn, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Returns Status Information About a Resumable Upload
 * @param {*} token 
 * @param {*} bucketKey 
 * @param {*} objectName 
 * @param {*} sessionId 
 * @param {*} retry 
 */
async function getUploadStatus (token, bucketKey, objectName, sessionId, retry = 0) {
  try {
    const res = await axios({
      headers: {
        Authorization: `Bearer ${token}`
      },
      method: 'GET',
      timeout: config.get('axios_timeout'),
      url: `${config.get('API_oss_host')}/buckets/${bucketKey}/objects/${objectName}/status/${sessionId}`
    })
    if (res.status === 202) {
      ret = {
        status: 202,
        message: res.data
      }
    }
    return ret
  } catch (err) {
    if (retry < 3) {
      await getUploadStatus(token, bucketKey, objectName, sessionId, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Retrieves user profile
 * @param {*} session 
 * @param {*} retry 
 */
async function getUserProfile(session, retry = 0) {
  try {
    const tokenSession = new Token(session)
    if (!tokenSession._session.passport) {
      logger.error('... Found empty passport session')
      throw new Error('Found empty passport session')
    }
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.get('axios_timeout'),
      url: url.resolve(config.get('API_data_host'), url.resolve(config.get('userprofile_path'), 'users/@me'))
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
      await getUserProfile(session, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Retrieve Version Refs
 * We only want children i.e. direction=from
 * @param {*} session 
 * @param {*} projectId 
 * @param {*} versionId 
 * @param {*} retry 
 */
async function getVersionRefs(session, projectId, versionId, retry=0) {
  try {
    const tokenSession = new Token(session)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      url: `${config.get('API_data_host')}/projects/${projectId}/versions/${encodeURIComponent(versionId)}/relationships/refs?filter[type]=versions&filter[direction]=from`
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
      await getVersionRefs(session, projectId, versionId, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Create a ZIP archive
 * containing parent and its reference files
 * @param {*} parentName 
 * @param {*} fileNames
 */
async function makeZipArchive(parentName, fileNames) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(`/tmp/${path.parse(parentName).name}.zip`)
    const archive = archiver('zip', { zlib: { level: 9} })
    output.on('close', () => {
      logger.info(`... compressed all files [${archive.pointer()} total bytes]`)
      resolve(archive.pointer())
    })
    output.on('end', () => {
      logger.info('... data has been drained')
    })
    output.on('warning', err => {
      if (err.code === 'ENOENT') {
        logger.warn(`Warning occurred while compressing the files: ${err}`)
      } else {
        reject(err)
      }
    })
    output.on('error', err => {
      reject(err)
    })
    archive.pipe(output)
    fileNames.forEach(file => {
      const filePath = `/tmp/${file}`
      archive.file(filePath, { name: file })
    })
    archive.finalize()
  })
}

/**
 * Download Fusion document and its references from Fusion Team
 * Upload f3z archive to OSS bucket
 * @param {*} session 
 * @param {*} objectName 
 * @param {*} payload 
 * @param {*} retry 
 */
async function moveAndCompressFusionFiles(session, objectName, payload, retry = 0) {
  try {
    const download = await downloadFile(session, payload.projectId, payload.versionId, 'f3z')
    if (download.status === 202) {
      let jobInfoResults = await pollDownloadJobInfo(session, download.message.links.self.href)
      if (jobInfoResults.message.data[0].type === 'failed') {
        throw new Error('Fusion Archive Download Failed')
      }
      if (jobInfoResults.message.data[0].type === 'downloads') {
        logger.info(`... Fusion Archive is downloadable from ${jobInfoResults.message.data[0].relationships.storage.meta.link.href}`)
        const file = await saveF3ZFile(session, objectName, jobInfoResults.message.data[0].relationships.storage.meta.link.href)
        // unzip the archive file in /tmp and read downloadAs value from DesignDescription.json
        if (file.status === 200 && file.filesize > 0) {
          const uploadZipRes = await uploadZipObject(objectName.replace('.f3d', '.zip'), file.filesize)
          if (uploadZipRes.status === 200) {
            ret = {
              status: uploadZipRes.status,
              message: uploadZipRes.message
            }
          }
        }
      }
    }
    return ret
  } catch (err) {
    if (retry < 3) {
      await moveAndCompressFusionFiles(session, objectName, payload, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Download Inventor assembly and its references from Fusion Team
 * Zip and compress the Inventor files
 * Upload the zip file to OSS bucket
 * @param {*} session 
 * @param {*} bucketKey 
 * @param {*} objectName 
 * @param {*} payload 
 * @param {*} retry 
 */
async function moveAndCompressInventorFiles(session, bucketKey, objectName, payload, retry = 0) {
  try {
    const parentRef = {
      extension: 'versions:autodesk.core:File',
      fileType: 'iam',
      location: `urn:adsk.objects:os.object:${bucketKey}/${objectName}`,
      name: payload.name,
      type: 'versions'
    }
    payload.refs.push(parentRef)
    const downloadAll = await downloadCADReferences(session, payload)
    if (downloadAll) {
      logger.info('... all reference files downloaded to /tmp')
      const fileNames = setCADReferenceFilesList(payload)
      const zipFileSize = await makeZipArchive(objectName, fileNames)
      if (zipFileSize > 0) {
        const uploadZipRes = await uploadZipObject(objectName, zipFileSize)
        if (uploadZipRes.status === 200) {
          ret = {
            status: uploadZipRes.status,
            message: uploadZipRes.message
          }
        }
      }
    }
    return ret
  } catch (err) {
    if (retry < 3) {
      await moveAndCompressInventorFiles(session, bucketKey, objectName, payload, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Download SolidWorks assembly and its references from Fusion Team
 * Zip and compress the SolidWorks files
 * Upload the zip file to OSS bucket
 * @param {*} session 
 * @param {*} bucketKey 
 * @param {*} objectName 
 * @param {*} payload 
 * @param {*} retry 
 */
async function moveAndCompressSolidWorksFiles(session, bucketKey, objectName, payload, retry = 0) {
  try {
    const parentRef = {
      extension: 'versions:autodesk.core:File',
      fileType: 'sldasm',
      location: `urn:adsk.objects:os.object:${bucketKey}/${objectName}`,
      name: payload.name,
      type: 'versions'
    }
    payload.refs.push(parentRef)
    const downloadAll = await downloadCADReferences(session, payload)
    if (downloadAll) {
      logger.info('... all reference files downloaded to /tmp')
      const fileNames = setCADReferenceFilesList(payload)
      const zipFileSize = await makeZipArchive(objectName, fileNames)
      if (zipFileSize > 0) {
        const uploadZipRes = await uploadZipObject(objectName, zipFileSize)
        if (uploadZipRes.status === 200) {
          ret = {
            status: uploadZipRes.status,
            message: uploadZipRes.message
          }
        }
      }
    }
    return ret
  } catch (err) {
    if (retry < 3) {
      await moveAndCompressSolidWorksFiles(session, bucketKey, objectName, payload, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Move object from A360 to OSS bucket
 * @param {} session 
 * @param {*} bucketKey 
 * @param {*} objectName 
 * @param {*} retry 
 */
async function moveObject(session, bucketKey, objectName, payload, retry = 0) {
  try {
    let moveOp
    if (!Array.isArray(payload.refs)) { return }
    if (payload.refs.length === 0) {
      moveOp = await moveSingleObject(session, bucketKey, objectName)
    }
    if (payload.refs.length > 0) {
      moveOp = await moveObjectWithRefs(session, bucketKey, objectName, payload)
    }
    if (moveOp.status === 200) {
      ret = {
        status: moveOp.status,
        message: moveOp.message
      }
    }
    return ret
  } catch (err) {
    if (retry < 3) {
      await moveObject(session, bucketKey, objectName, payload, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Move object and its references from A360 to OSS bucket
 * Step 1: download parent object and its children
 * Step 2: compress the files into a ZIP archive
 * Step 3: upload the ZIP file to OSS bucket
 * @param {*} session 
 * @param {*} bucketKey 
 * @param {*} objectName 
 * @param {*} refs 
 * @param {*} retry 
 */
async function moveObjectWithRefs(session, bucketKey, objectName, payload, retry = 0) {
  try {
    let moveOp
    if (payload.fileType === 'Inventor') {
      moveOp = await moveAndCompressInventorFiles(session, bucketKey, objectName, payload)
      if (moveOp.status === 200) {
        logger.info('... zip file uploaded to OSS')
        ret = {
          status: moveOp.status,
          message: moveOp.message
        }
      }
    } else if (payload.fileType === 'Fusion') {
      moveOp = await moveAndCompressFusionFiles(session, objectName, payload)
      if (moveOp.status === 200) {
        logger.info('... f3z file uploaded to OSS')
        ret = {
          status: moveOp.status,
          message: moveOp.message
        }
      }
    } else if (payload.fileType === 'NavisWorks') {
      // do something
    } else if (payload.fileType === 'SolidWorks') {
      moveOp = await moveAndCompressSolidWorksFiles(session, bucketKey, objectName, payload)
      if (moveOp.status === 200) {
        logger.info('... zip file uploaded to OSS')
        ret = {
          status: moveOp.status,
          message: moveOp.message
        }
      }
    }
    return ret
  } catch (err) {
    if (retry < 3) {
      await moveObjectWithRefs(session, bucketKey, objectName, payload, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Move single object from A360 to OSS bucket 
 * This object has no children references
 * @param {*} session 
 * @param {*} bucketKey 
 * @param {*} objectName 
 * @param {*} retry 
 */
async function moveSingleObject(session, bucketKey, objectName, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const mimeType = getMimeType(objectName)
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
      const twoLeggedToken = await getToken('oss')
      const uploadRes = await axios({ 
        data: buffer,
        headers: {
          Authorization: `Bearer ${twoLeggedToken.message.access_token}`,
          'Content-Length': res.headers['content-length'],
          'Content-Type': mimeType
        },
        maxContentLength: config.get('oss_file_upload_max_size'),
        method: 'PUT',
        url: `${config.get('API_oss_host')}/buckets/${config.get('bucket_key')}/objects/${objectName}`
      })
      if (uploadRes.status === 200) {
        logger.info('... file uploaded to OSS')
        ret = {
          status: uploadRes.status,
          message: uploadRes.data
        }
      }
    }
    return ret
  } catch (err) {
    if (retry < 3) {
      await moveSingleObject(session, bucketKey, objectName, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Poll Download Job Info
 * @param {*} session 
 * @param {*} href 
 */
async function pollDownloadJobInfo(session, href) {
  while (true) {
    try {
      let jobInfo = await getDownloadJobInfo(session, href)
      if (jobInfo.status === 200 
          && (jobInfo.message.data[0].type === 'downloads' 
          || jobInfo.message.data[0].type === 'failed')) { 
        return jobInfo 
      }
    } catch (err) {
      return handleError(err)
    }
  }
}

/**
 * Save Fusion Archive File under /tmp
 * On local Node.js server
 * @param {*} session 
 * @param {*} objectName
 * @param {*} href 
 */
async function saveF3ZFile(session, objectName, href, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      responseType: 'arraybuffer', 
      url: href
    })
    if (res.status === 200) {
      const buffer = Buffer.from(res.data, 'null')
      /**
      * BUG: https://jira.autodesk.com/browse/FDM-1219
      * download endpoints does not generate a F3Z archive
      * Instead it generates a file with F3D file extension
      * We need to rename the file from .f3d to .f3z
      */
      const f3zFile = `/tmp/${objectName.replace('.f3d', '.zip')}`
      const writeFile = util.promisify(fs.writeFile)
      await writeFile(f3zFile, buffer)
      const stats = fs.statSync(f3zFile)
      const fileSizeInBytes = stats.size
      if (fileSizeInBytes > 0) {
        ret = {
          filesize: fileSizeInBytes,
          status: res.status,
          message: res.data
        }
      }
    }
    return ret
  } catch (err) {
    if (retry < 3) {
      await saveF3ZFile(session, objectName, url, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Creates list of CAD files to archive
 * @param {*} payload 
 * @param {*} retry 
 */
function setCADReferenceFilesList(payload, retry = 0) {
  try {
    return payload.refs.reduce((fileNames, ref) => {
      fileNames.push(ref.name)
      if (ref.hasOwnProperty('children') && ref.children.length > 0) {
        let childPayload = {}
        childPayload.refs = ref.children
        fileNames = fileNames.concat(setCADReferenceFilesList(childPayload, retry = 0))
      }
      return fileNames
    }, [])
  } catch (err) {
    if (retry < 3) {
      setCADReferenceFilesList(payload, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Upload object to OSS
 * @param {*} objectName 
 * @param {*} fileSize 
 * @param {*} retry 
 */
async function uploadZipObject(objectName, fileSize, retry = 0) {
  try {
    const archiveName = `${path.parse(objectName).name}.zip`
    const mimeType = getMimeType(archiveName)
    const readFile = util.promisify(fs.readFile)
    const data = await readFile(`/tmp/${archiveName}`)
    if (data) {
      const twoLeggedToken = await getToken('oss')
      const uploadRes = await axios({ 
        data,
        headers: {
          Authorization: `Bearer ${twoLeggedToken.message.access_token}`,
          'Content-Disposition': archiveName,
          'Content-Length': fileSize,
          'Content-Type': mimeType
        },
        maxContentLength: config.get('oss_file_upload_max_size'),
        method: 'PUT',
        url: `${config.get('API_oss_host')}/buckets/${config.get('bucket_key')}/objects/${archiveName}`
      })
      if (uploadRes.status === 200) {
        ret = {
          status: uploadRes.status,
          message: uploadRes.data
        }
      }
    }
    return ret
  } catch (err) {
    if (retry < 3) {
      await uploadZipObject(objectName, fileSize, retry + 1)
    }
    return handleError(err)
  }
}

/**
 * Upload large files (over 100 MB)
 * @param {*} token 
 * @param {*} bucketKey 
 * @param {*} objectName 
 * @param {*} retry 
 */
async function uploadLargeFile(token, bucketKey, objectName, objectSize, retry = 0) {
  try {
    const mimeType = getMimeType(objectName)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Length': '5242880', // 5 MB
        'Content-Range': `1-15/${objectSize}`,
        'Content-Type': mimeType
      },
      method: 'PUT',
      timeout: config.get('axios_timeout'),
      url: `${config.get('API_oss_host')}/buckets/${bucketKey}/objects/${objectName}/resumable`
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
      await uploadLargeFile(token, bucketKey, objectName, objectSize, retry + 1)
    }
    return handleError(err)
  }
}

// add the methods to the module export
module.exports = {
  createBucket,
  downloadFile,
  downloadFormats,
  getBucketInfo,
  getDownloadInfo,
  getDownloadJobInfo,
  getFolderContents,
  getHubs,
  getItemVersionInfo,
  getItemVersions,
  getProject,
  getProjects,
  getThumbnail,
  getUploadStatus,
  getUserProfile,
  getVersionRefs,
  moveObject,
  uploadLargeFile
}