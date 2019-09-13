const axios = require('axios')
const fsExtra = require('fs-extra')
const logger = require('koa-log4').getLogger('admin')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

axios.defaults.withCredentials = true
axios.defaults.crossDomain = true

const { 
  setCatalogRootFolder
} = require('./catalog')

const Settings = require('../models/admin')
const handleError = require('../helpers/error-handler')

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
      await setFileFormatToggles({ 
        creo: false, 
        fbx: false,
        fusion: false, 
        inventor: false, 
        navisworks: false, 
        obj: false, 
        solidworks: false, 
        step: false 
      })
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
 * Set Application Name
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
          fbx: body.fbx,
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

module.exports = {
  clearCache,
  getApplicationName,
  getCompanyLogo,
  getFeatureToggles,
  getFileFormatToggles,
  getSettingByNameAndEmail,
  getSysAdmins,
  initializeDb,
  setAndUpdateDefaultHubProject,
  setApplicationName,
  setCompanyLogo,
  setFeatureToggles,
  setFileFormatToggles,
  setSysAdmins,
}
