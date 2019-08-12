'use strict'

const Router = require('koa-router')

const router = new Router({ prefix: '/api/oss' })

const { downloadObject } = require('../controllers/oss')

/**
 * Downloads object from OSS bucket
 */
router.get(
    '/download/bucket/:bucketKey/object/:objectKey',
    async ctx => {
        const { bucketKey, objectKey } = ctx.params
        const download = await downloadObject(bucketKey, objectKey)
        if (download) {
            ctx.status = download.status
            ctx.body = download.message
        }
    }
)

module.exports = router