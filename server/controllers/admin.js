const axios = require('axios')
const config = require('config')
const logger = require('koa-log4').getLogger('admin')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

axios.defaults.withCredentials = true
axios.defaults.crossDomain = true

const Settings = require('../models/admin')
const Publisher = require('../models/publish')
const handleError = require('../helpers/handle-error')

const { getToken } = require('./auth')
const { setCatalogRootFolder, updateCatalogFileSVF } = require('./catalog')

let ret = {
  status: 520,
  message: 'Unknown Error'
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
    if (retry < 3) {
      await deleteWebHook(hookId, retry + 1)
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
    return handleError
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
    return handleError
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
    return handleError
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
    return handleError
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
    return handleError
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
    if (retry < 3) {
      await getTranslateJobStatus(base64Urn, retry + 1)
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
    if (retry < 3) {
      await getWebHooks(retry + 1)
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
    if (retry < 3) {
      await setWebHook(retry + 1)
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
    if (retry < 3) {
      await translateJob(payload, retry + 1)
    }
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
async function updateSvfUrnInCatalogItem (resourceUrn, retry = 0) {
  try {
    let asciiResourceUrn = await Buffer.from(resourceUrn, 'base64')
    if (asciiResourceUrn) {
      asciiResourceUrn = asciiResourceUrn.toString('ascii')
      await updateCatalogFileSVF({ isFile: true, ossDesignUrn: asciiResourceUrn }, resourceUrn)
      await updatePublishLogEntry({ 'job.input.designUrn': asciiResourceUrn }, 'FINISHED', resourceUrn)
      const featureToggles = await getFeatureToggles()
      if (featureToggles.status === 200 && featureToggles.message[0].featureToggles.arvr_toolkit) {
        logger.info(`... Initiating translation to glTF format`)
        // TODO: translate to glTF next ... 
      }
    }
  } catch (err) {
    if (retry < 3) {
      await updateSvfUrnInCatalogItem(resourceUrn, retry + 1)
    }
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
