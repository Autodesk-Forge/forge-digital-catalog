'use strict'

const Router = require('koa-router')
const url = require('url')

const router = new Router({ prefix: '/api/catalog' })

const {
    deleteCatalogFile,
    deleteCatalogFolder,
    deleteCatalogFolderWithContent,
    getCatalogFile,
    getCatalogFileById,
    getCatalogFileByName,
    getCatalogFolderById,
    getCatalogRootFolder,
    getCatalogChildren,
    renameCatalogFolder,
    setCatalogFile,
    setCatalogFolder,
    updateCatalogFile,
    updateCatalogFileSVF
} = require('../controllers/catalog.js')

/**
 * Delete Catalog File
 */
router.delete(
    '/file',
    async ctx => {
        const file = await deleteCatalogFile(ctx.request.body)
        if (file) {
            ctx.status = file.status
            ctx.body = file.message
        }
    }
)

/**
 * Delete Catalog Folder
 */
router.delete(
    '/folder',
    async ctx => {
        const folder = await deleteCatalogFolderWithContent(ctx.request.body)
        if (folder) {
            ctx.status = folder.status
            ctx.body = folder.message
        }
    }
)

/**
 * Retrieve a Catalog Item by Id
 */
router.get(
    '/file/id/:id',
    async ctx => {
        const file = await getCatalogFileById(ctx.params.id)
        if (file) {
            ctx.status = file.status
            ctx.body = file.message
        }
    }
)

/**
 * Retrieve a Catalog Item by Name
 */
router.get(
    '/file/name/:name',
    async ctx => {
        const file = await getCatalogFileByName(ctx.params.name)
        if (file) {
            ctx.status = file.status
            ctx.body = file.message
        }
    }
)

/** 
 * Retrieve a Catalog Item By Path & Name
 */
router.get(
    '/file/path/:path/name/:name',
    async ctx => {
        const file = await getCatalogFile(ctx.params.name, ctx.params.path)
        if (file) {
            ctx.status = file.status
            ctx.body = file.message
        }
    }
)

/** 
 * Retrieve a Catalog Folder by Id
 */
router.get(
    '/folder/id/:id',
    async ctx => {
        const folder = await getCatalogFolderById(ctx.params.id)
        if (folder) {
            ctx.status = folder.status
            ctx.body = folder.message
        }
    }
)

/** 
 * Retrieve Catalog Root Folder
 */
router.get(
    '/folder/root',
    async ctx => {
        const rootFolder = await getCatalogRootFolder()
        if (rootFolder) {
            ctx.status = rootFolder.status
            ctx.body = rootFolder.message
        }
    }
)

/**
 * Retrieve Catalog Node's Children
 */
router.get(
    '/folder/path/:path',
    async ctx => {
        const children = await getCatalogChildren(ctx.params.path)
        if (children) {
            ctx.status = children.status
            ctx.body = children.message
        }
    }
)

/**
 * Create a Catalog Item
 */
router.post(
    '/file',
    async ctx => {
        const file = await setCatalogFile(ctx.request.body)
        if (file) {
            ctx.status = file.status
            ctx.body = file.message
        }
    }
)

/** 
 * Update a Catalog Item
 */
router.put(
    '/file/oss/*',
    async ctx => {
        const ossDesignUrn = url.parse(ctx.request.url).pathname.replace('/api/catalog/file/oss/', '')
        const file = await updateCatalogFile(ctx.request.body, ossDesignUrn)
        if (file) {
            ctx.status = file.status
            ctx.body = file.message
        }
    }
)

/**
 * Update SVF urn in Catalog Item
 */
router.put(
    '/file/svf/*',
    async ctx => {
        const svfUrn = url.parse(ctx.request.url).pathname.replace('/api/catalog/file/svf/', '')
        const file = await updateCatalogFileSVF(ctx.request.body, svfUrn)
        if (file) {
            ctx.status = file.status
            ctx.body = file.message
        }
    }
)

/**
 * Create a Catalog Folder
 */
router.post(
    '/folder',
    async ctx => {
        const folder = await setCatalogFolder(ctx.request.body)
        if (folder) {
            ctx.status = folder.status
            ctx.body = folder.message
        }
    }
)

/**
 * Rename a Catalog Folder
 */
router.patch(
    '/folder',
    async ctx => {
        const folder = await renameCatalogFolder(ctx.request.body)
        if (folder) {
            ctx.status = folder.status
            ctx.body = folder.message
        }
    }
)


module.exports = router