'use strict'

const Router = require('koa-router')

const router = new Router({ prefix: '/api/fusion' })

const {
  downloadFile,
  downloadFormats,
  getDownloadInfo,
  getFolderContents,
  getHubs,
  getItemVersionInfo,
  getItemVersions,
  getProject,
  getProjects,
  getThumbnail,
  getUserProfile,
  getVersionRefs,
  moveObject
} = require('../controllers/fusion')

/**
 * Request download of Fusion Archive
 */
router.post(
  '/download/fusion/projects/:projectId/versions/:versionId',
  async ctx => {
    const download = await downloadFile(ctx.session, ctx.params.projectId, ctx.params.versionId)
    if (download) {
      ctx.status = download.status
      ctx.body = download.message
    }
  }
)

/**
 * Retrieve details of a download
 */
router.get(
  '/download/projects/:projectId/downloads/:downloadId',
  async ctx => {
    const status = await getDownloadInfo(ctx.session, ctx.params.projectId, ctx.params.downloadId)
    if (status) {
      ctx.status = status.status
      ctx.body = status.message
    }
  }
)

/**
 * Move object from A360 to new OSS Bucket
 */
router.post(
  '/transfer/bucket/:bucketKey/object/:objectName',
  async ctx => {
    const transfer = await moveObject(ctx.session, ctx.params.bucketKey, ctx.params.objectName, ctx.request.body)
    if (transfer) {
      ctx.status = transfer.status
      ctx.body = transfer.message
    }
  }
)

/**
 * Downloads the thumbnail of the source file
 */
router.get(
  '/thumbnail/:urn',
  async ctx => {
    const thumbnail = await getThumbnail(ctx.params.urn)
    if (thumbnail) {
      ctx.status = thumbnail.status
      ctx.body = thumbnail.message
    }
  }
)

/**
 * Fetch User Profile
 */
router.get(
  '/user/profile',
  async ctx => {
    const profile = await getUserProfile(ctx.session)
    if (profile) {
      ctx.status = profile.status
      ctx.body = profile.message
    }
  }
)

/**
 * Retrieve Hubs
 */
router.get(
  '/hubs',
  async ctx => {
    const hubs = await getHubs(ctx.session)
    if (hubs) {
      ctx.status = hubs.status
      ctx.body = hubs.message
    }
  }
)

/**
 * Retrieve Project
 */
router.get(
  '/hubs/:hubId/projects/:projectId',
  async ctx => {
    const project = await getProject(ctx.session, ctx.params.hubId, ctx.params.projectId)
    if (project) {
      ctx.status = project.status
      ctx.body = project.message
    }
  }
)

/**
 * Retrieve Projects
 */
router.get(
  '/hubs/:hubId/projects',
  async ctx => {
    const projects = await getProjects(ctx.session, ctx.params.hubId)
    if (projects) {
      ctx.status = projects.status
      ctx.body = projects.message
    }
  }
)

/**
 * Retrieve Folder Contents
 */
router.get(
  '/projects/:projectId/folders/:folderId/contents',
  async ctx => {
    const folderContents = await getFolderContents(ctx.session, ctx.params.projectId, ctx.params.folderId)
    if (folderContents) {
      ctx.status = folderContents.status
      ctx.body = folderContents.message
    }
  }
)

/** 
 * Retrieve Item Version Details
 */
router.get(
  '/projects/:projectId/versions/:versionId',
  async ctx => {
    const version = await getItemVersionInfo(ctx.session, ctx.params.projectId, ctx.params.versionId)
    if (version) {
      ctx.status = version.status
      ctx.body = version.message
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
    const formats = await downloadFormats(ctx.session, ctx.params.projectId, ctx.params.versionId)
    if (formats) {
      ctx.status = formats.status
      ctx.body = formats.message
    }
  }
)

/**
 * Retrieve Item Versions
 */
router.get(
  '/projects/:projectId/items/:itemId/versions',
  async ctx => {
    const itemVersions = await getItemVersions(ctx.session, ctx.params.projectId, ctx.params.itemId)
    if (itemVersions) {
      ctx.status = itemVersions.status
      ctx.body = itemVersions.message
    }
  }
)

/** 
 * Retrieve Version Refs
 */
router.get(
  '/projects/:projectId/versions/:versionId/refs',
  async ctx => {
    const versionRefs = await getVersionRefs(ctx.session, ctx.params.projectId, ctx.params.versionId)
    if (versionRefs) {
      ctx.status = versionRefs.status
      ctx.body = versionRefs.message
    }
  }
)

module.exports = router
