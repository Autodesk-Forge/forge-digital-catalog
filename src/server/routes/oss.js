'use strict'

const logger = require('koa-log4').getLogger('oss')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

const Router = require('koa-router')

const router = new Router({ prefix: '/api/oss' })

const { downloadObject } = require('../controllers/oss')

/**
 * Downloads object from OSS bucket
 */
router.get(
    '/download/bucket/:bucketKey/object/:objectKey',
    async ctx => {
        try {
            const { bucketKey, objectKey } = ctx.params
            const download = await downloadObject(bucketKey, objectKey)
            if (download) {
                ctx.status = download.status
                ctx.body = download.message
            }
        } catch (err) {
            logger.error(err)
            ctx.status = 500
            ctx.body = 'A server error occurred while downloading an object'
        }
    }
)

module.exports = router