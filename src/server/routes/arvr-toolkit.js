'use strict'

const Router = require('koa-router')

const router = new Router({ prefix: '/api/arvr-toolkit' })

const {
  get3DViewableFilesByGuid,
  get3DViewableResourceByGuid,
  get3DViewablesGuids,
  translateSVFToglTF
} = require('../controllers/arvr-toolkit')

/**
 * List all files available for a 3D viewable GUID
 */
router.get(
  '/:urn/guids/:guid',
  async ctx => {
    const { urn, guid } = ctx.params
    const files = await get3DViewableFilesByGuid(urn, guid)
    if (files) {
      ctx.status = files.status
      ctx.body = files.message
    }
  }
)

/**
 * Trigger SVF-to-glTF translation
 */
router.post(
  '/:urn/guids/:guid',
  async ctx => {
    const { urn, guid } = ctx.params
    const translate = await translateSVFToglTF(urn, guid)
    if (translate) {
      ctx.status = translate.status
      ctx.body = translate.message
    }
  }
)

/**
 * Returns raw data of a specific resource of a 3D viewable GUID
 */
router.get(
  '/:urn/guids/:guid/resources/:resource',
  async ctx => {
    const { urn, guid, resource } = ctx.params
    const resourceData = await get3DViewableResourceByGuid(urn, guid, resource)
    if (resourceData) {
      ctx.status = resourceData.status
      ctx.body = resourceData.message
    }
  }
)

/**
 * List GUIDs of all 3D viewables in an URN.
 */
router.get(
  '/:urn/viewables/guids',
  async ctx => {
    const guids = await get3DViewablesGuids(ctx.params.urn)
    if (guids) {
      ctx.status = guids.status
      ctx.body = guids.message
    }
  }
)

module.exports = router
