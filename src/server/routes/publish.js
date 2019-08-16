'use strict'

const logger = require('koa-log4').getLogger('publish')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

const Router = require('koa-router')
const url = require('url')

const router = new Router({ prefix: '/api/admin' })

const {
    getPublishLogs,
    getTranslateJobStatus,
    setPublishLog,
    translateJob
} = require('../controllers/publish')

/**
 * Retrieve the Publisher Logs
 */
router.get('/publish/logs', async ctx => {
    try {
      const logs = await getPublishLogs()
      if (logs) {
        ctx.status = logs.status
        ctx.body = logs.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving the publisher logs'
    }
})

/**
 * Set Publish Log Entry
 */
router.post('/publish/logs', async ctx => {
    try {
      const log = await setPublishLog(ctx.request.body)
      if (log) {
        ctx.status = log.status
        ctx.body = log.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while saving new publisher log entry'
    }
})

/**
 * Translate CAD model to SVF
 */
router.post('/translate', async ctx => {
    try {
      const job = await translateJob(ctx.request.body)
      if (job) {
        ctx.status = job.status
        ctx.body = job.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred during translation'
    }
})

/**
 * Get Translation Job Status
 */
router.get('/translate/*', async ctx => {
    try {
      const base64Urn = encodeURIComponent(
        url.parse(ctx.request.url).pathname.replace('/api/admin/translate/', '')
      )
      const status = await getTranslateJobStatus(base64Urn)
      if (status) {
        ctx.status = status.status
        ctx.body = status.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving translation status'
    }
})

module.exports = router