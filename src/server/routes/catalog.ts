'use strict';

import Router from '@koa/router';
import { Context, DefaultState } from 'koa';
import log4 from 'koa-log4';
import url from 'url';
import { Catalog } from '../controllers/catalog';

const logger = log4.getLogger('catalog');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

const catalogController = new Catalog();
const router = new Router<DefaultState, Context>({ prefix: '/api/catalog' });

/**
 * Delete Catalog File
 */
router.delete(
  '/file',
  async (ctx: Context): Promise<void> => {
    try {
      const file = await catalogController.deleteCatalogFile(ctx.request.body);
      if (!!file) {
        ctx.status = 200;
        ctx.body = JSON.stringify(file);
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while deleting catalog item';
    }
  }
);

/**
 * Delete Catalog Folder
 */
router.delete(
  '/folder',
  async (ctx: Context): Promise<void> => {
    try {
      const folder = await catalogController.deleteCatalogFolderWithContent(
        ctx.request.body
      );
      if (!!folder) {
        ctx.status = 200;
        ctx.body = JSON.stringify(folder);
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while deleting catalog folder';
    }
  }
);

/**
 * Retrieve a Catalog Item by Id
 */
router.get(
  '/file/id/:id',
  async (ctx: Context): Promise<void> => {
    try {
      const file = await catalogController.getCatalogFileById(ctx.params.id);
      if (!!file) {
        ctx.status = 200;
        ctx.body = JSON.stringify(file);
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving catalog item';
    }
  }
);

/**
 * Retrieve a Catalog Item by Name
 */
router.get(
  '/file/name/:name',
  async (ctx: Context): Promise<void> => {
    try {
      const file = await catalogController.getCatalogFileByName(ctx.params.name);
      if (!!file) {
        ctx.status = 200;
        ctx.body = JSON.stringify(file);
      }
      ctx.status = 404; // Not Found
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving catalog item';
    }
  }
);

/**
 * Retrieve a Catalog Item By Path & Name
 */
router.get(
  '/file/path/:path/name/:name',
  async (ctx: Context): Promise<void> => {
    try {
      const file = await catalogController.getCatalogFile(ctx.params.name, ctx.params.path);
      if (!!file) {
        ctx.status = 200;
        ctx.body = JSON.stringify(file);
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving catalog item';
    }
  }
);

/**
 * Retrieve a Catalog Item By Source Design Urn
 */
router.get(
  '/file/storage/:urn',
  async (ctx: Context): Promise<void> => {
    try {
      const file = await catalogController.getCatalogFileBySrcDesignUrn(ctx.params.urn);
      if (!!file) {
        ctx.status = 200;
        ctx.body = JSON.stringify(file);
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving catalog item';
    }
  }
);

/**
 * Retrieve a Catalog Folder by Id
 */
router.get(
  '/folder/id/:id',
  async (ctx: Context): Promise<void> => {
    try {
      const folder = await catalogController.getCatalogFolderById(ctx.params.id);
      if (!!folder) {
        ctx.status = 200;
        ctx.body = JSON.stringify(folder);
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving catalog folder';
    }
  }
);

/**
 * Retrieve Catalog Root Folder
 */
router.get(
  '/folder/root',
  async (ctx: Context): Promise<void> => {
    try {
      const rootFolder = await catalogController.getCatalogRootFolder();
      if (!!rootFolder) {
        ctx.status = 200;
        ctx.body = JSON.stringify(rootFolder);
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving catalog root folder';
    }
  }
);

/**
 * Retrieve Catalog Node's Children
 */
router.get(
  '/folder/path/:path',
  async (ctx: Context): Promise<void> => {
    try {
      const children = await catalogController.getCatalogChildren(ctx.params.path);
      if (!!children) {
        ctx.status = 200;
        ctx.body = JSON.stringify(children);
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving catalog children';
    }
  }
);

/**
 * Create a Catalog Item
 */
router.post(
  '/file',
  async (ctx: Context): Promise<void> => {
    try {
      const file = await catalogController.setCatalogFile(ctx.request.body);
      if (!!file) {
        ctx.status = 200;
        ctx.body = JSON.stringify(file);
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while creating new catalog item';
    }
  }
);

/**
 * Update a Catalog Item
 */
router.put(
  '/file/oss/(.*)',
  async (ctx: Context): Promise<void> => {
    try {
      const urlRequest = url.parse(ctx.request.url);
      const newUrl = urlRequest.pathname;
      if (newUrl) {
        const ossDesignUrn = newUrl.replace('/api/catalog/file/oss/', '');
        const file = await catalogController.updateCatalogFile(ctx.request.body, ossDesignUrn);
        if (!!file) {
          ctx.status = 200;
          ctx.body = JSON.stringify(file);
        }
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while updating a catalog item';
    }
  }
);

/**
 * Update SVF urn in Catalog Item
 */
router.put(
  '/file/svf/(.*)',
  async (ctx: Context): Promise<void> => {
    try {
      const urlRequest = url.parse(ctx.request.url);
      const newUrl = urlRequest.pathname;
      if (newUrl) {
        const svfUrn = newUrl.replace('/api/catalog/file/svf/', '');
        const file = await catalogController.updateCatalogFileSvf(ctx.request.body, svfUrn);
        if (!!file) {
          ctx.status = 200;
          ctx.body = JSON.stringify(file);
        }
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while updating a catalog item';
    }
  }
);

/**
 * Create a Catalog Folder
 */
router.post(
  '/folder',
  async (ctx: Context): Promise<void> => {
    try {
      const folder = await catalogController.setCatalogFolder(ctx.request.body);
      if (!!folder) {
        ctx.status = 200;
        ctx.body = JSON.stringify(folder);
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while creating new catalog folder';
    }
  }
);

/**
 * Rename a Catalog Folder
 */
router.patch(
  '/folder',
  async (ctx: Context): Promise<void> => {
    try {
      const folder = await catalogController.renameCatalogFolder(ctx.request.body);
      if (!!folder) {
        ctx.status = 200;
        ctx.body = folder;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while renaming a catalog folder';
    }
  }
);

export default router;
