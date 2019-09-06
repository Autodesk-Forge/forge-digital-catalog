const archiver = require('archiver')
const axios = require('axios')
const config = require('config')
const fs = require('fs')
const logger = require('koa-log4').getLogger('publish')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }
const path = require('path')

axios.defaults.withCredentials = true
axios.defaults.crossDomain = true

const { convertToGltf } = require('./arvr-toolkit')
const {
    getCatalogFileByOSSDesignUrn, 
    updateCatalogFileSvf, 
    updateCatalogFileGltf 
} = require('./catalog')
const { getFeatureToggles } = require('./admin')
const { getToken } = require('../helpers/auth')
const handleError = require('../helpers/error-handler')
const { uploadZipObject } = require('../helpers/file-handler')
const { getManifest, traverseManifest } = require('../helpers/forge')
const { optimizeGltf } = require('../helpers/gltf-handler')

const Publisher = require('../models/publish')

let ret = {
    status: 520,
    message: 'Unknown Error'
}

/**
 * Archives and uploads optimized Gltf files to OSS bucket
 * @param {*} urn 
 */
async function compressGltfOutput(urn) {
    try {
      const outputFolder = path.join('/tmp', 'cache')
      const urnFolder = path.join(outputFolder, urn)
      const optimizedFilePaths = []
      listFilesInDirectory(urnFolder, filePath => {
        if (filePath.includes('-optimized.')) {
          optimizedFilePaths.push(filePath)
          optimizedFilePaths.push(filePath.replace('.gltf', '.bin'))
          optimizedFilePaths.push(path.join(path.dirname(filePath), 'output.metadata.json'))
          optimizedFilePaths.push(path.join(path.dirname(filePath), 'props.db'))
        }
      })
      const catalogFile = await getCatalogFileByOSSDesignUrn(urn)
      await createArchive(catalogFile.message.svfUrn, optimizedFilePaths)
    } catch(err) {
      return handleError(err)
    }
}

/**
 * Compress the glTF output files into an archive 
 * @param {*} fileNames 
 */
async function createArchive(archiveName, fileNames) {
    try {
      return new Promise((resolve, reject) => {
        let zipFileName = path.basename(archiveName, path.extname(archiveName))
        const archiveFile = `/tmp/cache/${zipFileName}_gltf.zip`
        if (fs.existsSync(archiveFile)) fs.unlinkSync(archiveFile)
        const output = fs.createWriteStream(archiveFile)
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
            logger.warn(err)
            reject(err)
          }
        })
        output.on('error', err => {
          logger.error(err)
          reject(err)
        })
        archive.pipe(output)
        fileNames.forEach(filePath => {
          archive.file(filePath, { name: path.basename(filePath) })
        })
        archive.finalize()
      })
    } catch (err) {
      return handleError(err)
    }
}

/**
 * Runs the tasks needed post translation
 * @param {*} resourceUrn 
 */
async function finalizePublishJob (resourceUrn) {
    try {
      let asciiResourceUrn = await Buffer.from(resourceUrn, 'base64')
      if (asciiResourceUrn) {
        asciiResourceUrn = asciiResourceUrn.toString('ascii')
        await updateCatalogFileSvf({ isFile: true, ossDesignUrn: asciiResourceUrn }, resourceUrn)
        await updatePublishLogEntry({ 'job.input.designUrn': asciiResourceUrn }, 'FINISHED', resourceUrn)
        const featureToggles = await getFeatureToggles()
        if (featureToggles.status === 200 && featureToggles.message[0].featureToggles.arvr_toolkit) {
          await translateSvfToGltf(asciiResourceUrn)
          logger.info('... Successfully translated CAD model to SVF and glTF formats')
          await optimizeGltfOutput(asciiResourceUrn)
          logger.info('... Successfully optimized all glTF files')
          await compressGltfOutput(asciiResourceUrn)
          logger.info('... Successfully compressed Gltf files')
          await uploadGltfArchiveToBucket(asciiResourceUrn)
          logger.info('... Successfully uploaded Gltf archive')
        }
      }
    } catch (err) {
      return handleError(err)
    }
}

/**
 * Retrieve Publisher Logs
 */
async function getPublishLogs() {
    try {
      const logs = await Publisher.find({}).exec()
      if (logs) {
        ret = {
          status: 200,
          message: logs
        }
      }
      return ret
    } catch (err) {
      return handleError(err)
    }
}

/**
 * Retrieves translation job status
 * This function can be used for testing, but should not be called
 * in production as we should rely on the WebHook instead
 */
async function getTranslateJobStatus(base64Urn, retry = 0) {
    try {
      const token = await getToken()
      let url
      switch (config.get('region')) {
        case 'US':
          url = `${config.get(
            'API_derivative_host'
          )}/designdata/${base64Urn}/manifest`
          break
        case 'EMEA':
          url = `h${config.get(
            'API_derivative_host'
          )}/regions/eu/designdata/${base64Urn}/manifest`
          break
        default:
          url = `h${config.get(
            'API_derivative_host'
          )}/designdata/${base64Urn}/manifest`
      }
      const res = await axios({
        headers: {
          Authorization: `Bearer ${token.message.access_token}`
        },
        method: 'GET',
        url
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
        await getTranslateJobStatus(base64Urn, retry)
      }
      return handleError(err)
    }
}

/**
 * List files recursively in a directory
 * @param {*} dir 
 * @param {*} callback 
 */
function listFilesInDirectory(dir, callback) {
    try {
      fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f)
        let isDirectory = fs.statSync(dirPath).isDirectory()
        isDirectory ? listFilesInDirectory(dirPath, callback) : callback(path.join(dir, f))
      })
    } catch (err) {
      return handleError(err)
    }
}

/**
 * Optimizes the glTF files
 * @param {*} urn 
 */
async function optimizeGltfOutput(urn) {
    try {
      const outputFolder = path.join('/tmp', 'cache')
      const urnFolder = path.join(outputFolder, urn)
      const gltfFilePaths = []
      listFilesInDirectory(urnFolder, filePath => {
        if (path.extname(filePath).toLowerCase() === '.gltf' && !filePath.endsWith('-optimized.gltf')) {
          gltfFilePaths.push(filePath)
        }
      })
      await Promise.all(gltfFilePaths.map(async (filePath) => {
        logger.info(`... Optimizing glTF output of file: ${filePath}`)
        await optimizeGltf(filePath)
        return Promise.resolve(filePath)
      }))
    } catch (err) {
      return handleError(err)
    }
}

/** 
 * Sets Publish Log Entry
 */
async function setPublishLog(body) {
    try {
      const log = new Publisher(body)
      log.save((err, logEntry) => {
        if (err) {
          ret = {
            status: 500,
            message: err
          }
        }
        ret = {
          status: 200,
           message: logEntry
        }
      })
      return ret
    } catch (err) {
      return handleError(err)
    }
}

/**
 * Translate a CAD model to web viewable (SVF)
 * @param {*} session
 * @param {*} payload
 * @param {*} retry
 */
async function translateJob(payload, retry = 0) {
    try {
      const region = config.get('region')
      const workflow = config.get('webhook.workflow')
      payload.misc.workflow = workflow
      payload.output.destination.region = region
      const token = await getToken()
      const res = await axios({
        data: payload,
        headers: {
          Authorization: `Bearer ${token.message.access_token}`,
          'Content-Type': 'application/json',
          'x-ads-force': true // the endpoint replaces previously translated output file types with the newly generated derivatives
        },
        method: 'POST',
        url: `${config.get('API_derivative_host')}/designdata/job`
      })
      if (res.status === 200 || res.status === 201) {
        ret = {
          status: res.status,
          message: res.data
        }
      }
      return ret
    } catch (err) {
      retry++
      if (retry < 3) {
        await translateJob(payload, retry)
      }
      return handleError(err)
    }
}

/**
 * Translate SVF bubble to glTF format
 * @param {*} urn 
 * @param {*} retry 
 */
async function translateSvfToGltf(urn) {
    try {
      const token = await getToken()
      const catalogFile = await getCatalogFileByOSSDesignUrn(urn)
      const manifest = await getManifest(catalogFile.message.svfUrn, token.message.access_token)
      const guids = []
      traverseManifest(manifest, function(node) {
        if (node.mime === 'application/autodesk-svf') {
          guids.push(node.guid)
        }
      })
      const outputFolder = path.join('/tmp', 'cache')
      const urnFolder = path.join(outputFolder, urn)
      if (!fs.existsSync(urnFolder)) fs.mkdirSync(urnFolder, { recursive: true })
      await Promise.all(guids.map(async guid => {
        logger.info(`... Starting translation to glTF of viewable guid: ${guid}`)
        return await convertToGltf(catalogFile.message.svfUrn, guid, token.message.access_token, urnFolder)
      }))
    } catch (err) {
      return handleError(err)
    }
}

/**
 * Update Publish Log Status
 * @param {*} payload 
 * @param {*} status 
*/
async function updatePublishLogEntry(payload, status, svfUrn) {
    try {
      const publishLog = await Publisher.findOneAndUpdate(
        payload,{
          $set: {
            'job.output.svfUrn': svfUrn,
            'status': status
          }
        }, {
          new: true,
          upsert: true
        }).exec()
      if (publishLog) {
        ret = {
          status: 200,
          message: publishLog
        }
      }
      return ret
    } catch (err) {
      return handleError(err)
    }
}

  
/**
 * Upload Gltf archive to OSS bucket
 * @param {*} urn 
*/
async function uploadGltfArchiveToBucket(urn) {
    try {
        const outputFolder = path.join('/tmp', 'cache')
        const catalogFile = await getCatalogFileByOSSDesignUrn(urn)
        const zipFileName = `${catalogFile.message.svfUrn}_gltf.zip`
        let zipFileSize
        listFilesInDirectory(outputFolder, filePath => {
          if (filePath.endsWith(zipFileName)) {
            const stats = fs.statSync(filePath)
            zipFileSize = stats.size
          }
        })
        logger.info(`... Uploading glTF archive ${zipFileName} to bucket [${zipFileSize} total bytes]`)
        const uploadZipRes = await uploadZipObject(zipFileName, zipFileSize)
        if (uploadZipRes.status === 200) {
          const payload = {
            isFile: true,
            isPublished: true,
            ossDesignUrn: urn, 
            svfUrn: catalogFile.message.svfUrn
          }
          const catalogItem = await updateCatalogFileGltf(payload, uploadZipRes.message)
          if (catalogItem.status === 200) {
            logger.info('... Updated catalog item with glTF data')
          } 
        }
    } catch (err) {
      return handleError(err)
    }
}

module.exports = {
    finalizePublishJob,
    getPublishLogs,
    getTranslateJobStatus,
    setPublishLog,
    translateJob
}