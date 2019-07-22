'use strict'

const Router = require('koa-router')
const url = require('url')

const router = new Router({ prefix: '/api/admin' })

const {
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
} = require('../controllers/admin')

/**
 * Get Application Name from Database
 */
router.get('/ApplicationName', async ctx => {
  const applicationName = await getApplicationName()
  if (applicationName) {
    ctx.status = applicationName.status
    ctx.body = applicationName.message
  }
})

/**
 * Set Application Name in Database
 */
router.post('/ApplicationName', async ctx => {
  const applicationName = await setApplicationName(ctx.request.body)
  if (applicationName) {
    ctx.status = applicationName.status
    ctx.body = applicationName.message
  }
})

/**
 * Get current System Administrators from the Database
 */
router.get('/CompanyLogo', async ctx => {
  const companylogo = await getCompanyLogo()
  if (companylogo) {
    ctx.status = companylogo.status
    ctx.body = companylogo.message
  }
})

/**
 * Set the System Administrators
 */
router.post('/CompanyLogo', async ctx => {
  const companylogo = await setCompanyLogo(ctx.request.body)
  if (companylogo) {
    ctx.status = companylogo.status
    ctx.body = companylogo.message
  }
})

/**
 * Set and update default hub project setting
 */
router.post('/default/hub/project', async ctx => {
  const setting = await setAndUpdateDefaultHubProject(ctx.request.body)
  if (setting) {
    ctx.status = setting.status
    ctx.body = setting.message
  }
})

/**
 * Get setting by name and email
 */
router.get('/settings/:name/email/:email', async ctx => {
  const setting = await getSettingByNameAndEmail(
    ctx.params.name,
    ctx.params.email
  )
  if (setting) {
    ctx.status = setting.status
    ctx.body = setting.message
  }
})

/**
 * Set Feature Toggles
 */
router.post('/settings/features', async ctx => {
  const settings = await setFeatureToggles(ctx.request.body)
  if (settings) {
    ctx.status = settings.status
    ctx.body = settings.message
  }
})

/**
 * Retrieve Feature Toggles
 */
router.get('/settings/features', async ctx => {
  const settings = await getFeatureToggles()
  if (settings) {
    ctx.status = settings.status
    ctx.body = settings.message
  }
})

/**
 * Set File Format Toggles
 */
router.post('/settings/fileformats', async ctx => {
  const fileformats = await setFileFormatToggles(ctx.request.body)
  if (fileformats) {
    ctx.status = fileformats.status
    ctx.body = fileformats.message
  }
})

/**
 * Retrieve File Format Toggles
 */
router.get('/settings/fileformats', async ctx => {
  const fileformats = await getFileFormatToggles()
  if (fileformats) {
    ctx.status = fileformats.status
    ctx.body = fileformats.message
  }
})

/**
 * Retrieve the Publisher Logs
 */
router.get('/publish/logs', async ctx => {
  const logs = await getPublishLogs()
  if (logs) {
    ctx.status = logs.status
    ctx.body = logs.message
  }
})

/**
 * Set Publish Log Entry
 */
router.post('/publish/logs', async ctx => {
  const log = await setPublishLog(ctx.request.body)
  if (log) {
    ctx.status = log.status
    ctx.body = log.message
  }
})

/**
 * Translate CAD model to SVF
 */
router.post('/translate', async ctx => {
  const job = await translateJob(ctx.request.body)
  if (job) {
    ctx.status = job.status
    ctx.body = job.message
  }
})

/**
 * Get Translation Job Status
 */
router.get('/translate/*', async ctx => {
  const base64Urn = encodeURIComponent(
    url.parse(ctx.request.url).pathname.replace('/api/admin/translate/', '')
  )
  const status = await getTranslateJobStatus(base64Urn)
  if (status) {
    ctx.status = status.status
    ctx.body = status.message
  }
})

/**
 * Delete System WebHook
 */
router.delete('/webhooks/:hookId', async ctx => {
  const webhook = await deleteWebHook(ctx.params.hookId)
  if (webhook) {
    ctx.status = webhook.status
    ctx.body = webhook.message
  }
})

/**
 * Get System WebHooks
 */
router.get('/webhooks', async ctx => {
  const webhooks = await getWebHooks()
  if (webhooks) {
    ctx.status = webhooks.status
    ctx.body = webhooks.message
  }
})

/**
 * Create WebHook for Model Derivative Events
 */
router.post('/webhooks', async ctx => {
  const webhook = await setWebHook()
  if (webhook) {
    ctx.status = webhook.status
    ctx.body = webhook.message
  }
})

/**
 * Translation Webhook Callback
 */
router.post('/webhook/callback', async ctx => {
  ctx.status = 200
  ctx.body = ctx.request.body
  if (
    ctx.request.body &&
    ctx.request.body.payload.Payload.status === 'success'
  ) {
    await updateSvfUrnInCatalogItem(ctx.request.body.payload.URN)
  }
})

/**
 * Get current System Administrators from the Database
 */
router.get('/SysAdmins', async ctx => {
  const sysadmins = await getSysAdmins()
  if (sysadmins) {
    ctx.status = sysadmins.status
    ctx.body = sysadmins.message
  }
})

/**
 * Set the System Administrators
 */
router.post('/SysAdmins', async ctx => {
  const sysadmins = await setSysAdmins(ctx.request.body)
  if (sysadmins) {
    ctx.status = sysadmins.status
    ctx.body = sysadmins.message
  }
})

module.exports = router
