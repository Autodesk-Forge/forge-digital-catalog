'use strict'

const logger = require('koa-log4').getLogger('fusion')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

const Router = require('koa-router')

const router = new Router({ prefix: '/api/fusion' })

const {
  getFolderContents,
  getHubs,
  getItemVersionInfo,
  getItemVersions,
  getProject,
  getProjects,
  getThumbnail,
  getUserProfile,
  getVersionRefs
} = require('../controllers/fusion')

const {
  downloadFile,
  downloadFormats,
  getDownloadInfo,
  moveObject
} = require('../helpers/file-handler')

/**
 * Request download of Fusion Archive
 */
router.post(
  '/download/fusion/projects/:projectId/versions/:versionId',
  async ctx => {
    try {
      const download = await downloadFile(ctx.session, ctx.params.projectId, ctx.params.versionId)
      if (download) {
        ctx.status = download.status
        ctx.body = download.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while downloading the Fusion archive'
    }
  }
)

/**
 * Retrieve details of a download
 */
router.get(
  '/download/projects/:projectId/downloads/:downloadId',
  async ctx => {
    try {
      const status = await getDownloadInfo(ctx.session, ctx.params.projectId, ctx.params.downloadId)
      if (status) {
        ctx.status = status.status
        ctx.body = status.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving download details'
    }
  }
)

/**
 * Move object from A360 to new OSS Bucket
 */
router.post(
  '/transfer/bucket/:bucketKey/object/:objectName',
  async ctx => {
    try {
      const transfer = await moveObject(ctx.session, ctx.params.bucketKey, ctx.params.objectName, ctx.request.body)
      if (transfer) {
        ctx.status = transfer.status
        ctx.body = transfer.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while moving object to bucket'
    }
  }
)

/**
 * Downloads the thumbnail of the source file
 */
router.get(
  '/thumbnail/:urn',
  async ctx => {
    try {
      const thumbnail = await getThumbnail(ctx.params.urn)
      if (thumbnail) {
        ctx.status = thumbnail.status
        ctx.body = thumbnail.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while downloading thumbnail'
    }
  }
)

/**
 * Fetch User Profile
 */
router.get(
  '/user/profile',
  async ctx => {
    try {
      const profile = await getUserProfile(ctx.session)
      if (profile) {
        ctx.status = profile.status
        ctx.body = profile.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving user profile'
    }
  }
)

/**
 * Retrieve Hubs
 */
router.get(
  '/hubs',
  async ctx => {
    try {
      const hubs = await getHubs(ctx.session)
      if (hubs) {
        ctx.status = hubs.status
        ctx.body = hubs.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving hubs'
    }
  }
)

/**
 * Retrieve Project
 */
router.get(
  '/hubs/:hubId/projects/:projectId',
  async ctx => {
    try {
      const project = await getProject(ctx.session, ctx.params.hubId, ctx.params.projectId)
      if (project) {
        ctx.status = project.status
        ctx.body = project.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving project'
    }
  }
)

/**
 * Retrieve Projects
 */
router.get(
  '/hubs/:hubId/projects',
  async ctx => {
    try {
      const projects = await getProjects(ctx.session, ctx.params.hubId)
      if (projects) {
        ctx.status = projects.status
        ctx.body = projects.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving projects'
    }
  }
)

/**
 * Retrieve Folder Contents
 */
router.get(
  '/projects/:projectId/folders/:folderId/contents',
  async ctx => {
    try {
      const folderContents = await getFolderContents(ctx.session, ctx.params.projectId, ctx.params.folderId)
      if (folderContents) {
        ctx.status = folderContents.status
        ctx.body = folderContents.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving folder contents'
    }
  }
)

/** 
 * Retrieve Item Version Details
 */
router.get(
  '/projects/:projectId/versions/:versionId',
  async ctx => {
    try {
      const version = await getItemVersionInfo(ctx.session, ctx.params.projectId, ctx.params.versionId)
      if (version) {
        ctx.status = version.status
        ctx.body = version.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving item version details'
    }
  }
)

/**
 * Returns a collection of supported file formats
 * this version could be converted to and downloaded as
 */
router.get(
  '/projects/:projectId/versions/:versionId/formats',
  async ctx => {
    try {
      const formats = await downloadFormats(ctx.session, ctx.params.projectId, ctx.params.versionId)
      if (formats) {
        ctx.status = formats.status
        ctx.body = formats.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving supported file formats'
    }
  }
)

/**
 * Retrieve Item Versions
 */
router.get(
  '/projects/:projectId/items/:itemId/versions',
  async ctx => {
    try {
      const itemVersions = await getItemVersions(ctx.session, ctx.params.projectId, ctx.params.itemId)
      if (itemVersions) {
        ctx.status = itemVersions.status
        ctx.body = itemVersions.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving item versions'
    }
  }
)

/** 
 * Retrieve Version Refs
 */
router.get(
  '/projects/:projectId/versions/:versionId/refs',
  async ctx => {
    try {
      const versionRefs = await getVersionRefs(ctx.session, ctx.params.projectId, ctx.params.versionId)
      if (versionRefs) {
        ctx.status = versionRefs.status
        ctx.body = versionRefs.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving version references'
    }
  }
)

module.exports = router
