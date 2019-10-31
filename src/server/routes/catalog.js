'use strict'

const logger = require('koa-log4').getLogger('catalog')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

const Router = require('koa-router')
const url = require('url')

const router = new Router({ prefix: '/api/catalog' })

const {
    deleteCatalogFile,
    deleteCatalogFolderWithContent,
    getCatalogFile,
    getCatalogFileById,
    getCatalogFileByName,
    getCatalogFileBySrcDesignUrn,
    getCatalogFolderById,
    getCatalogRootFolder,
    getCatalogChildren,
    renameCatalogFolder,
    setCatalogFile,
    setCatalogFolder,
    updateCatalogFile,
    updateCatalogFileSvf
} = require('../controllers/catalog.js')

/**
 * Delete Catalog File
 */
router.delete(
    '/file',
    async ctx => {
        try {
            const file = await deleteCatalogFile(ctx.request.body)
            if (file) {
                ctx.status = file.status
                ctx.body = file.message
            }
        } catch (err) {
            logger.error(err)
            ctx.status = 500
            ctx.body = 'A server error occurred while deleting catalog item'
        }
    }
)

/**
 * Delete Catalog Folder
 */
router.delete(
    '/folder',
    async ctx => {
        try {
            const folder = await deleteCatalogFolderWithContent(ctx.request.body)
            if (folder) {
                ctx.status = folder.status
                ctx.body = folder.message
            }
        } catch (err) {
            logger.error(err)
            ctx.status = 500
            ctx.body = 'A server error occurred while deleting catalog folder'
        }
    }
)

/**
 * Retrieve a Catalog Item by Id
 */
router.get(
    '/file/id/:id',
    async ctx => {
        try {
            const file = await getCatalogFileById(ctx.params.id)
            if (file) {
                ctx.status = file.status
                ctx.body = file.message
            }
        } catch (err) {
            logger.error(err)
            ctx.status = 500
            ctx.body = 'A server error occurred while retrieving catalog item'
        }
    }
)

/**
 * Retrieve a Catalog Item by Name
 */
router.get(
    '/file/name/:name',
    async ctx => {
        try {
            const file = await getCatalogFileByName(ctx.params.name)
            if (file) {
                ctx.status = file.status
                ctx.body = file.message
            }
        } catch (err) {
            logger.error(err)
            ctx.status = 500
            ctx.body = 'A server error occurred while retrieving catalog item'
        }
    }
)

/** 
 * Retrieve a Catalog Item By Path & Name
 */
router.get(
    '/file/path/:path/name/:name',
    async ctx => {
        try {
            const file = await getCatalogFile(ctx.params.name, ctx.params.path)
            if (file) {
                ctx.status = file.status
                ctx.body = file.message
            }
        } catch (err) {
            logger.error(err)
            ctx.status = 500
            ctx.body = 'A server error occurred while retrieving catalog item'
        }
    }
)

/**
 * Retrieve a Catalog Item By Source Design Urn
 */
router.post(
    '/file/storage',
    async ctx => {
        try {
            const file = await getCatalogFileBySrcDesignUrn(ctx.request.body)
            if (file) {
                ctx.status = file.status
                ctx.body = file.message
            }
        } catch (err) {
            logger.error(err)
            ctx.status = 500
            ctx.body = 'A server error occurred while retrieving catalog item'
        }
    }
)

/** 
 * Retrieve a Catalog Folder by Id
 */
router.get(
    '/folder/id/:id',
    async ctx => {
        try {
            const folder = await getCatalogFolderById(ctx.params.id)
            if (folder) {
                ctx.status = folder.status
                ctx.body = folder.message
            }
        } catch (err) {
            logger.error(err)
            ctx.status = 500
            ctx.body = 'A server error occurred while retrieving catalog folder'
        }
    }
)

/** 
 * Retrieve Catalog Root Folder
 */
router.get(
    '/folder/root',
    async ctx => {
        try {
            const rootFolder = await getCatalogRootFolder()
            if (rootFolder) {
                ctx.status = rootFolder.status
                ctx.body = rootFolder.message
            }
        } catch (err) {
            logger.error(err)
            ctx.status = 500
            ctx.body = 'A server error occurred while retrieving catalog root folder'
        }
    }
)

/**
 * Retrieve Catalog Node's Children
 */
router.get(
    '/folder/path/:path',
    async ctx => {
        try {
            const children = await getCatalogChildren(ctx.params.path)
            if (children) {
                ctx.status = children.status
                ctx.body = children.message
            }
        } catch (err) {
            logger.error(err)
            ctx.status = 500
            ctx.body = 'A server error occurred while retrieving catalog children'
        }
    }
)

/**
 * Create a Catalog Item
 */
router.post(
    '/file',
    async ctx => {
        try {
            const file = await setCatalogFile(ctx.request.body)
            if (file) {
                ctx.status = file.status
                ctx.body = file.message
            }
        } catch (err) {
            logger.error(err)
            ctx.status = 500
            ctx.body = 'A server error occurred while creating new catalog item'
        }
    }
)

/** 
 * Update a Catalog Item
 */
router.put(
    '/file/oss/*',
    async ctx => {
        try {
            const ossDesignUrn = url.parse(ctx.request.url).pathname.replace('/api/catalog/file/oss/', '')
            const file = await updateCatalogFile(ctx.request.body, ossDesignUrn)
            if (file) {
                ctx.status = file.status
                ctx.body = file.message
            }
        } catch (err) {
            logger.error(err)
            ctx.status = 500
            ctx.body = 'A server error occurred while updating a catalog item'
        }
    }
)

/**
 * Update SVF urn in Catalog Item
 */
router.put(
    '/file/svf/*',
    async ctx => {
        try {
            const svfUrn = url.parse(ctx.request.url).pathname.replace('/api/catalog/file/svf/', '')
            const file = await updateCatalogFileSvf(ctx.request.body, svfUrn)
            if (file) {
                ctx.status = file.status
                ctx.body = file.message
            }
        } catch (err) {
            logger.error(err)
            ctx.status = 500
            ctx.body = 'A server error occurred while updating a catalog item'
        }
    }
)

/**
 * Create a Catalog Folder
 */
router.post(
    '/folder',
    async ctx => {
        try {
            const folder = await setCatalogFolder(ctx.request.body)
            if (folder) {
                ctx.status = folder.status
                ctx.body = folder.message
            }
        } catch (err) {
            logger.error(err)
            ctx.status = 500
            ctx.body = 'A server error occurred while creating new catalog folder'
        }
    }
)

/**
 * Rename a Catalog Folder
 */
router.patch(
    '/folder',
    async ctx => {
        try {
            const folder = await renameCatalogFolder(ctx.request.body)
            if (folder) {
                ctx.status = folder.status
                ctx.body = folder.message
            }
        } catch (err) {
            logger.error(err)
            ctx.status = 500
            ctx.body = 'A server error occurred while renaming a catalog folder'
        }
    }
)

module.exports = router