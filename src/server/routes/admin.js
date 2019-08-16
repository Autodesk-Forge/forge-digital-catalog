'use strict'

const logger = require('koa-log4').getLogger('admin')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

const Router = require('koa-router')

const router = new Router({ prefix: '/api/admin' })

const {
  getApplicationName,
  getCompanyLogo,
  getFeatureToggles,
  getFileFormatToggles,
  getSettingByNameAndEmail,
  getSysAdmins,
  setAndUpdateDefaultHubProject,
  setApplicationName,
  setCompanyLogo,
  setFeatureToggles,
  setFileFormatToggles,
  setSysAdmins
} = require('../controllers/admin')

/**
 * Get Application Name from Database
 */
router.get('/ApplicationName', async ctx => {
  try {
    const applicationName = await getApplicationName()
    if (applicationName) {
      ctx.status = applicationName.status
      ctx.body = applicationName.message
    }
  } catch (err) {
    logger.error(err)
    ctx.status = 500
    ctx.body = 'A server error occurred while retrieving the application name'
  }
})

/**
 * Set Application Name in Database
 */
router.post('/ApplicationName', async ctx => {
  try {
    const applicationName = await setApplicationName(ctx.request.body)
    if (applicationName) {
      ctx.status = applicationName.status
      ctx.body = applicationName.message
    }
  } catch (err) {
    logger.error(err)
    ctx.status = 500
    ctx.body = 'A server error occurred while setting the application name'
  }
})

/**
 * Get current System Administrators from the Database
 */
router.get('/CompanyLogo', async ctx => {
  try {
    const companylogo = await getCompanyLogo()
    if (companylogo) {
      ctx.status = companylogo.status
      ctx.body = companylogo.message
    }
  } catch (err) {
    logger.error(err)
    ctx.status = 500
    ctx.body = 'A server error occurred while retrieving the company logo'
  }
})

/**
 * Set the System Administrators
 */
router.post('/CompanyLogo', async ctx => {
  try {
    const companylogo = await setCompanyLogo(ctx.request.body)
    if (companylogo) {
      ctx.status = companylogo.status
      ctx.body = companylogo.message
    }
  } catch (err) {
    logger.error(err)
    ctx.status = 500
    ctx.body = 'A server error occurred while setting the company logo'
  }
})

/**
 * Set and update default hub project setting
 */
router.post('/default/hub/project', async ctx => {
  try {
    const setting = await setAndUpdateDefaultHubProject(ctx.request.body)
    if (setting) {
      ctx.status = setting.status
      ctx.body = setting.message
    }
  } catch (err) {
    logger.error(err)
    ctx.status = 500
    ctx.body = 'A server error occurred while setting the default hub and project'
  }
})

/**
 * Get setting by name and email
 */
router.get('/settings/:name/email/:email', async ctx => {
  try {
    const setting = await getSettingByNameAndEmail(
      ctx.params.name,
      ctx.params.email
    )
    if (setting) {
      ctx.status = setting.status
      ctx.body = setting.message
    }
  } catch (err) {
    logger.error(err)
    ctx.status = 500
    ctx.body = 'A server error occurred while retrieving user settings'
  }
})

/**
 * Set Feature Toggles
 */
router.post('/settings/features', async ctx => {
  try {
    const settings = await setFeatureToggles(ctx.request.body)
    if (settings) {
      ctx.status = settings.status
      ctx.body = settings.message
    }
  } catch (err) {
    logger.error(err)
    ctx.status = 500
    ctx.body = 'A server error occurred while setting feature toggles'
  }
})

/**
 * Retrieve Feature Toggles
 */
router.get('/settings/features', async ctx => {
  try {
    const settings = await getFeatureToggles()
    if (settings) {
      ctx.status = settings.status
      ctx.body = settings.message
    }
  } catch (err) {
    logger.error(err)
    ctx.status = 500
    ctx.body = 'A server error occurred while retrieving feature toggles'
  }
})

/**
 * Set File Format Toggles
 */
router.post('/settings/fileformats', async ctx => {
  try {
    const fileformats = await setFileFormatToggles(ctx.request.body)
    if (fileformats) {
      ctx.status = fileformats.status
      ctx.body = fileformats.message
    }
  } catch (err) {
    logger.error(err)
    ctx.status = 500
    ctx.body = 'A server error occurred while saving file formats'
  }
})

/**
 * Retrieve File Format Toggles
 */
router.get('/settings/fileformats', async ctx => {
  try {
    const fileformats = await getFileFormatToggles()
    if (fileformats) {
      ctx.status = fileformats.status
      ctx.body = fileformats.message
    }
  } catch (err) {
    logger.error(err)
    ctx.status = 500
    ctx.body = 'A server error occurred while retrieving file formats'
  }
})

/**
 * Get current System Administrators from the Database
 */
router.get('/SysAdmins', async ctx => {
  try {
    const sysadmins = await getSysAdmins()
    if (sysadmins) {
      ctx.status = sysadmins.status
      ctx.body = sysadmins.message
    }
  } catch (err) {
    logger.error(err)
    ctx.status = 500
    ctx.body = 'A server error occurred while retrieving web admins'
  }
})

/**
 * Set the System Administrators
 */
router.post('/SysAdmins', async ctx => {
  try {
    const sysadmins = await setSysAdmins(ctx.request.body)
    if (sysadmins) {
      ctx.status = sysadmins.status
      ctx.body = sysadmins.message
    }
  } catch (err) {
    logger.error(err)
    ctx.status = 500
    ctx.body = 'A server error occurred while saving web admins'
  }
})

module.exports = router
