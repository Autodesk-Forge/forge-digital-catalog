'use strict'

const logger = require('koa-log4').getLogger('webhooks')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

const Router = require('koa-router')

const router = new Router({ prefix: '/api/admin' })

const {
  finalizePublishJob
} = require('../controllers/publish')

const { 
    deleteWebHook,
    getWebHooks,
    setWebHook
 } = require('../controllers/webhooks')

/**
 * Delete System WebHook
 */
router.delete('/webhooks/:hookId', async ctx => {
    try {
      const webhook = await deleteWebHook(ctx.params.hookId)
      if (webhook) {
        ctx.status = webhook.status
        ctx.body = webhook.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while deleting a WebHook'
    }
})
  
/**
 * Get System WebHooks
*/
router.get('/webhooks', async ctx => {
    try {
      const webhooks = await getWebHooks()
      if (webhooks) {
        ctx.status = webhooks.status
        ctx.body = webhooks.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving the WebHooks'
    }
})
  
/**
 * Create WebHook for Model Derivative Events
*/
router.post('/webhooks', async ctx => {
    try {
      const webhook = await setWebHook()
      if (webhook) {
        ctx.status = webhook.status
        ctx.body = webhook.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while saving new WebHook'
    }
})


/**
 * Translation Webhook Callback
 */
router.post('/webhook/callback', async ctx => {
    try {
      ctx.status = 200
      ctx.body = {}
      if (
        ctx.request.body &&
        ctx.request.body.payload.Payload.status === 'success'
      ) {
        logger.info('... translation completed, finalizing the publishing job')
        finalizePublishJob(ctx.request.body.payload.URN)
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while finalizing the publishing job'
    }
})

module.exports = router