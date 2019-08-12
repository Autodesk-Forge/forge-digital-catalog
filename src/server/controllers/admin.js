const archiver = require('archiver')
const axios = require('axios')
const config = require('config')
const fs = require('fs')
const fsExtra = require('fs-extra')
const logger = require('koa-log4').getLogger('admin')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }
const path = require('path')

axios.defaults.withCredentials = true
axios.defaults.crossDomain = true

const { convertToGltf } = require('./arvr-toolkit')
const { 
  getCatalogFileByOSSDesignUrn, 
  setCatalogRootFolder, 
  updateCatalogFileGltf, 
  updateCatalogFileSvf 
} = require('./catalog')

const Settings = require('../models/admin')
const Publisher = require('../models/publish')

const { getToken } = require('../helpers/auth')
const handleError = require('../helpers/error-handler')
const { uploadZipObject } = require('../helpers/file-handler')
const { getManifest, traverseManifest } = require('../helpers/forge')
const { optimizeGltf } = require('../helpers/gltf-handler')

let ret = {
  status: 520,
  message: 'Unknown Error'
}

/**
 * Removes the folder and files under /tmp/cache
 */
async function clearCache() {
  try {
    await fsExtra.remove('/tmp/cache')
  } catch (err) {
    logger.error(err)
  }
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
 * Delete Webhook
 * @param {*} hookId
 * @param {*} retry
 */
async function deleteWebHook(hookId, retry = 0) {
  try {
    const token = await getToken()
    const res = await axios({
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.message.access_token}`
      },
      method: 'DELETE',
      url: `${config.get(
        'API_webhook_host'
      )}/systems/derivative/events/extraction.finished/hooks/${hookId}`
    })
    if (res.status === 200) {
      ret = {
        status: res.status,
        message: res.data
      }
    }
    return ret
  } catch (err) {
    logger.error(err)
    if (retry < 3) {
      await deleteWebHook(hookId, retry++)
    }
    return handleError(err)
  }
}

/**
 * Get Application Name
 */
async function getApplicationName() {
  try {
    const settings = await Settings.find({
      name: 'applicationName'
    }).exec()
    if (settings) {
      ret = {
        status: 200,
        message: settings
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

/**
 * Get Company Logo
 */
async function getCompanyLogo() {
  try {
    const logo = await Settings.find({
      name: 'companyLogo'
    }).exec()
    if (logo) {
      ret = {
        status: 200,
        message: logo
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

/**
 * Get Feature Toggles
 */
async function getFeatureToggles() {
  try {
    const settings = await Settings.find({
      name: 'featureToggles'
    }).exec()
    if (settings) {
      ret = {
        status: 200,
        message: settings
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

/**
 * Retrieve File Format Toggles
 */
async function getFileFormatToggles() {
  try {
    const settings = await Settings.find({
      name: 'fileFormatToggles'
    }).exec()
    if (settings) {
      ret = {
        status: 200,
        message: settings
      }
    }
    return ret
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
 * Queries MongoDB for defaultHubProject setting
 * @param {*} name
 * @param {*} email
 */
async function getSettingByNameAndEmail(name, email) {
  try {
    const setting = await Settings.find({
      name,
      email
    }).exec()
    if (setting) {
      ret = {
        status: 200,
        message: setting
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

/**
 * Get System Administrators
 */
async function getSysAdmins() {
  try {
    const settings = await Settings.find({
      name: 'webAdmins'
    }).exec()
    if (settings) {
      ret = {
        status: 200,
        message: settings
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
    logger.error(err)
    if (retry < 3) {
      await getTranslateJobStatus(base64Urn, retry++)
    }
    return handleError(err)
  }
}

/**
 * Retrieves Webhooks
 * @param {*} retry
 */
async function getWebHooks(retry = 0) {
  try {
    const token = await getToken()
    const res = await axios({
      headers: {
        Authorization: `Bearer ${token.message.access_token}`
      },
      method: 'GET',
      url: `${config.get(
        'API_webhook_host'
      )}/systems/derivative/events/extraction.finished/hooks`
    })
    if (res.status === 200) {
      ret = {
        status: res.status,
        message: res.data
      }
    }
    return ret
  } catch (err) {
    logger.error(err)
    if (retry < 3) {
      await getWebHooks(retry++)
    }
    return handleError(err)
  }
}

/**
 * Initializes database on first server run
 */
async function initializeDb() {
  try {
    await setCatalogRootFolder()
    const webAdmins = await getSysAdmins()
    if (webAdmins.status === 200 && webAdmins.message.length === 0) {
      logger.info('... Initializing web admins')
      await setSysAdmins([])
    }
    const featureToggles = await getFeatureToggles()
    if (featureToggles.status === 200 && featureToggles.message.length === 0) {
      logger.info('... Initializing feature toggles')
      await setFeatureToggles({ animation: false, arvr: false, twin: false })
    }
    const fileFormats = await getFileFormatToggles()
    if (fileFormats.status === 200 && fileFormats.message.length === 0) {
      logger.info('... Initializing supported file formats')
      await setFileFormatToggles({ creo: false, fusion: false, inventor: false, navisworks: false, obj: false, solidworks: false, step: false })
    }
  } catch (err) {
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
 * Stores in MongoDB defaultHubProject setting
 * @param {*} body
 */
async function setAndUpdateDefaultHubProject(body) {
  try {
    const setting = await Settings.findOneAndUpdate(
      {
        name: 'defaultHubProject',
        email: body.email
      },
      body,
      {
        new: true,
        upsert: true
      }
    ).exec()
    if (setting) {
      ret = {
        status: 200,
        message: setting
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

/**
 * Set Applciation Name
 * @param {*} body
 */
async function setApplicationName(body) {
  try {
    const settings = await Settings.findOneAndUpdate(
      {
        name: 'applicationName'
      },{
        name: 'applicationName',
        appName: body.value
      },{
        new: true,
        upsert: true
      }
    ).exec()
    if (settings) {
      ret = {
        status: 200,
        message: settings
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}


/**
 * Set companyLogo
 * @param {*} body
 */
async function setCompanyLogo(body) {
  try {
    const settings = await Settings.findOneAndUpdate(
      {
        name: 'companyLogo'
      },{
        name: 'companyLogo',
        imageSrc: body.imageSrc
      },{
        new: true,
        upsert: true
      }
    ).exec()
    if (settings) {
      ret = {
        status: 200,
        message: settings
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

/**
 * Set Features Toggles
 * @param {*} body
 */
async function setFeatureToggles(body) {
  try {
    const settings = await Settings.findOneAndUpdate(
      {
        name: 'featureToggles'
      },
      {
        name: 'featureToggles',
        featureToggles: {
          fusion_animation: body.animation,
          arvr_toolkit: body.arvr,
          digital_twin: body.twin
        }
      },
      {
        new: true,
        upsert: true
      }
    ).exec()
    if (settings) {
      ret = {
        status: 200,
        message: settings
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

/**
 * Set File Format Toggles
 * @param {*} body
 */
async function setFileFormatToggles(body) {
  try {
    const settings = await Settings.findOneAndUpdate(
      {
        name: 'fileFormatToggles'
      },
      {
        name: 'fileFormatToggles',
        fileFormatToggles: {
          creo: body.creo,
          fusion: body.fusion,
          inventor: body.inventor,
          navisworks: body.navisworks,
          obj: body.obj,
          solidworks: body.solidworks,
          step: body.step
        }
      },
      {
        new: true,
        upsert: true
      }
    ).exec()
    if (settings) {
      ret = {
        status: 200,
        message: settings
      }
    }
    return ret
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
 * Set System Administators
 * @param {*} body
 */
async function setSysAdmins(body) {
  try {
    const settings = await Settings.findOneAndUpdate(
      {
        name: 'webAdmins'
      },{
        name: 'webAdmins',
        webAdmins: body
      },{
        new: true,
        upsert: true
      }
    ).exec()
    if (settings) {
      ret = {
        status: 200,
        message: settings
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

/**
 * Creates Model Derivative WebHook
 */
async function setWebHook(retry = 0) {
  try {
    const token = await getToken()
    const callbackUrl = (process.env.NODE_ENV === 'production') ? config.get('webhook.callbackURL') : config.get('ngrok.callbackURL')
    const data = {
      callbackUrl,
      scope: {
        workflow: config.get('webhook.workflow')
      }
    }
    const res = await axios({
      data,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.message.access_token}`
      },
      method: 'POST',
      url: `${config.get(
        'API_webhook_host'
      )}/systems/derivative/events/extraction.finished/hooks`
    })
    if (res.status === 201) {
      ret = {
        status: res.status,
        message: res.data
      }
    }
    return ret
  } catch (err) {
    logger.error(err)
    if (retry < 3) {
      await setWebHook(retry++)
    }
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
    logger.error(err)
    if (retry < 3) {
      await translateJob(payload, retry++)
    }
    return handleError(err)
  }
}

/**
 * Translate SVF bubble to glTF format
 * @param {*} urn 
 * @param {*} retry 
 */
async function translateSvftoGltf(urn) {
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
 * Updates Catalog Item in MongoDB with new SVF urn
 * @param {*} resourceUrn 
 */
async function updateSvfUrnInCatalogItem (resourceUrn) {
  try {
    let asciiResourceUrn = await Buffer.from(resourceUrn, 'base64')
    if (asciiResourceUrn) {
      asciiResourceUrn = asciiResourceUrn.toString('ascii')
      await updateCatalogFileSvf({ isFile: true, ossDesignUrn: asciiResourceUrn }, resourceUrn)
      await updatePublishLogEntry({ 'job.input.designUrn': asciiResourceUrn }, 'FINISHED', resourceUrn)
      const featureToggles = await getFeatureToggles()
      if (featureToggles.status === 200 && featureToggles.message[0].featureToggles.arvr_toolkit) {
        await translateSvftoGltf(asciiResourceUrn)
        logger.info('... Successfully translated CAD model to SVF and glTF formats')
        await optimizeGltfOutput(asciiResourceUrn)
        logger.info('... Successfully optimized all glTF files')
        await compressGltfOutput(asciiResourceUrn)
        logger.info('... Successfully compressed Gltf files')
        await uploadGltfArchiveToBucket(asciiResourceUrn)
        logger.info('... Successfully uploaded Gltf archive')
        await clearCache()
      }
    }
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
  deleteWebHook,
  getApplicationName,
  getCompanyLogo,
  getFeatureToggles,
  getFileFormatToggles,
  getPublishLogs,
  getSettingByNameAndEmail,
  getSysAdmins,
  getTranslateJobStatus,
  getWebHooks,
  initializeDb,
  setAndUpdateDefaultHubProject,
  setApplicationName,
  setCompanyLogo,
  setFeatureToggles,
  setFileFormatToggles,
  setPublishLog,
  setSysAdmins,
  setWebHook,
  translateJob,
  updateSvfUrnInCatalogItem
}
