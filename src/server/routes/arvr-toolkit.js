'use strict'

const logger = require('koa-log4').getLogger('arvr-toolkit')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

const Router = require('koa-router')

const router = new Router({ prefix: '/api/arvr-toolkit' })

const {
  get3DViewableFilesByGuid,
  get3DViewableResourceByGuid,
  get3DViewablesGuids,
  translateSvfToGltf
} = require('../controllers/arvr-toolkit')

/**
 * List all files available for a 3D viewable GUID
 */
router.get(
  '/:urn/guids/:guid',
  async ctx => {
    try {
      const { urn, guid } = ctx.params
      const files = await get3DViewableFilesByGuid(urn, guid)
      if (files) {
        ctx.status = files.status
        ctx.body = files.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving the 3D viewable GUID'
    }
  }
)

/**
 * Trigger SVF-to-glTF translation
 */
router.post(
  '/:urn/guids/:guid',
  async ctx => {
    try {
      const { urn, guid } = ctx.params
      const translate = await translateSvfToGltf(urn, guid)
      if (translate) {
        ctx.status = translate.status
        ctx.body = translate.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while translating to glTF'
    }
  }
)

/**
 * Returns raw data of a specific resource of a 3D viewable GUID
 */
router.get(
  '/:urn/guids/:guid/resources/:resource',
  async ctx => {
    try {
      const { urn, guid, resource } = ctx.params
      const resourceData = await get3DViewableResourceByGuid(urn, guid, resource)
      if (resourceData) {
        ctx.status = resourceData.status
        ctx.body = resourceData.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving resource of a 3D viewable GUID'
    }
  }
)

/**
 * List GUIDs of all 3D viewables in an URN.
 */
router.get(
  '/:urn/viewables/guids',
  async ctx => {
    try {
      const guids = await get3DViewablesGuids(ctx.params.urn)
      if (guids) {
        ctx.status = guids.status
        ctx.body = guids.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving all 3D viewable GUIDs'
    }
  }
)

module.exports = router
