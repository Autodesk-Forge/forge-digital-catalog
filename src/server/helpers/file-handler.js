const archiver = require('archiver')
const axios = require('axios')
const config = require('config')
const fs = require('fs')
const handleError = require('./error-handler')
const logger = require('koa-log4').getLogger('file-handler')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }
const path = require('path')
const util = require('util')
const streamZip = require('node-stream-zip')

const Token = require('../auth/token')
const { getToken } = require('./auth')

const { downloadCADReferences, setCADReferenceFilesList } = require('./xref-handler')

const { updateCatalogFileRootFilename } = require('../controllers/catalog')

let ret = {
  status: 520,
  message: 'Unknown Error'
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
    retry++
    if (retry < 3) {
      await downloadFile(session, projectId, versionId, fileType, retry)
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
    retry++
    if (retry < 3) {
      await downloadFormats(session, projectId, versionId, retry)
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
    retry++
    if (retry < 3) {
      await getDownloadInfo(session, projectId, downloadId, retry)
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
    retry++
    if (retry < 3) {
      await getDownloadJobInfo(session, href, retry)
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
 * Read Manifest.json to retrieve rootFilename
 * @param {*} filePath 
 */
async function getRootFileFromManifest(filePath) {
  try {
    return new Promise((resolve, reject) => {
      const zip = new streamZip({
        file: filePath,
        storeEntries: true
      })
      zip.on('error', err => {
        reject(err)
      })
      zip.on('ready', () => {
        // read manifest in memory
        const manifest = zip.entryDataSync('Manifest.json').toString('utf8')
        zip.close()
        resolve(JSON.parse(manifest))
      })
    })
  } catch (err) {
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
    retry++
    if (retry < 3) {
      await getUploadStatus(token, bucketKey, objectName, sessionId, retry)
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
    const output = fs.createWriteStream(`/tmp/cache/${path.parse(parentName).name}.zip`)
    const archive = archiver('zip', { zlib: { level: 9} })
    output.on('close', () => {
      logger.info(`... Compressed all files [${archive.pointer()} total bytes]`)
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
      const filePath = `/tmp/cache/${file}`
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
        if (file.status === 200 && file.filesize > 0) {
          let archiveName = objectName.replace('.f3d', '.zip')
          archiveName = `${path.parse(archiveName).name}.zip`
          const uploadZipRes = await uploadZipObject(archiveName, file.filesize)
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
    retry++
    if (retry < 3) {
      await moveAndCompressFusionFiles(session, objectName, payload, retry)
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
      logger.info('... all reference files downloaded to /tmp/cache')
      const fileNames = setCADReferenceFilesList(payload)
      const zipFileSize = await makeZipArchive(objectName, fileNames)
      if (zipFileSize > 0) {
        const archiveName = `${path.parse(objectName).name}.zip`
        const uploadZipRes = await uploadZipObject(archiveName, zipFileSize)
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
    retry++
    if (retry < 3) {
      await moveAndCompressInventorFiles(session, bucketKey, objectName, payload, retry)
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
      logger.info('... all reference files downloaded to /tmp/cache')
      const fileNames = setCADReferenceFilesList(payload)
      const zipFileSize = await makeZipArchive(objectName, fileNames)
      if (zipFileSize > 0) {
        const archiveName = `${path.parse(objectName).name}.zip`
        const uploadZipRes = await uploadZipObject(archiveName, zipFileSize)
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
    retry++
    if (retry < 3) {
      await moveAndCompressSolidWorksFiles(session, bucketKey, objectName, payload, retry)
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
    retry++
    if (retry < 3) {
      await moveObject(session, bucketKey, objectName, payload, retry)
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
    retry++
    if (retry < 3) {
      await moveSingleObject(session, bucketKey, objectName, retry)
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
        await translateFixForFusionRefs(payload)
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
    retry++
    if (retry < 3) {
      await moveObjectWithRefs(session, bucketKey, objectName, payload, retry)
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
 * Save Fusion Archive File under /tmp/cache
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
      if (!fs.existsSync(path.join('/tmp', 'cache'))) { fs.mkdirSync(path.join('/tmp', 'cache'))}
      const f3zFile = `/tmp/cache/${objectName.replace('.f3d', '.zip')}`
      const writeFile = util.promisify(fs.writeFile)
      await writeFile(f3zFile, buffer)
      const stats = fs.statSync(f3zFile)
      const fileSizeInBytes = stats.size
      if (fileSizeInBytes > 0) {
        ret = {
          filesize: fileSizeInBytes,
          path: f3zFile,
          status: res.status,
          message: res.data
        }
      }
    }
    return ret
  } catch (err) {
    retry++
    if (retry < 3) {
      await saveF3ZFile(session, objectName, href, retry)
    }
    return handleError(err)
  }
}

/**
 * Workaround for known bug: 
 * https://jira.autodesk.com/browse/ATEAM-21384
 * Forge DM endpoint allows downloading a Fusion archive,
 * but the filenames are changed, need to set rootFilename
 * to correct value.
 * The workaround consists in renaming downloaded Fusion archive
 * to zip file extension, reading from memory Manifest.json
 * to extract rootFilename value, translate zip file with updated 
 * rootFilename.
 * @param {*} payload 
 */
async function translateFixForFusionRefs(payload) {
  try {
    const archiveFile = path.basename(payload.storageLocation).replace('.f3d', '.zip')
    const archivePath = path.join('/tmp', 'cache', archiveFile)
    const srcDesignUrn = payload.storageLocation
    const rootFilename = await getRootFileFromManifest(archivePath)
    logger.info(`... retrieved new rootFilename value from Manifest.json ${rootFilename.root}`)
    await updateCatalogFileRootFilename({ isFile: true, srcDesignUrn }, rootFilename.root)
    logger.info('... successfully stored new rootFilename value in catalog item')
  } catch (err) {
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
    retry++
    if (retry < 3) {
      await uploadLargeFile(token, bucketKey, objectName, objectSize, retry)
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
async function uploadZipObject(archiveName, fileSize) {
  try {
    const mimeType = getMimeType(archiveName)
    const readFile = util.promisify(fs.readFile)
    const data = await readFile(`/tmp/cache/${archiveName}`)
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
    return handleError(err)
  }
}

module.exports = {
  downloadFile,
  downloadFormats,
  getDownloadInfo,
  getDownloadJobInfo,
  getMimeType,
  getUploadStatus,
  makeZipArchive,
  moveObject,
  pollDownloadJobInfo,
  saveF3ZFile,
  uploadLargeFile,
  uploadZipObject
}