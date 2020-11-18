'use strict';

import Router from '@koa/router';
import { Context, DefaultState } from 'koa';
import log4 from 'koa-log4';
import { Fusion } from '../controllers/fusion';
import { FileHandler } from '../helpers/file-handler';

const logger = log4.getLogger('fusion');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

const fileHelper = new FileHandler();
const fusionController = new Fusion();
const router = new Router<DefaultState, Context>({ prefix: '/api/fusion' });

/**
 * Request download of Fusion Archive
 */
router.post(
  '/download/fusion/projects/:projectId/versions/:versionId',
  async (ctx: Context): Promise<void> => {
    try {
      const params = ctx.params as { filetype: string; projectId: string; versionId: string };
      const download = await fileHelper.downloadFile(
        ctx.session,
        params.projectId,
        params.versionId,
        params.filetype
      );
      if (!!download) {
        ctx.status = download.status;
        ctx.body = download.data;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while downloading the Fusion archive';
    }
  }
);

/**
 * Retrieve details of a download
 */
router.get(
  '/download/projects/:projectId/downloads/:downloadId',
  async (ctx: Context): Promise<void> => {
    try {
      const params = ctx.params as { downloadId: string; projectId: string };
      const download = await fileHelper.getDownloadInfo(ctx.session, params.projectId, params.downloadId);
      if (!!download) {
        ctx.status = 200;
        ctx.body = download.data;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving download details';
    }
  }
);

/**
 * Move object from A360 to new OSS Bucket
 */
router.post(
  '/transfer/bucket/:bucketKey/object/:objectName',
  async (ctx: Context): Promise<void> => {
    try {
      const params = ctx.params as { bucketKey: string; objectName: string };
      const transfer = await fileHelper.moveObject(
        ctx.session,
        params.bucketKey,
        params.objectName,
        ctx.request.body
      );
      if (!!transfer) {
        ctx.status = 200;
        ctx.body = transfer;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while moving object to bucket';
    }
  }
);

/**
 * Downloads the thumbnail of the source file
 */
router.get(
  '/thumbnail/:urn',
  async (ctx: Context): Promise<void> => {
    try {
      const params = ctx.params as { urn: string };
      const thumbnail = await fusionController.getThumbnail(params.urn);
      if (!!thumbnail) {
        ctx.status = 200;
        ctx.body = thumbnail;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while downloading thumbnail';
    }
  }
);

/**
 * Fetch User Profile
 */
router.get(
  '/user/profile',
  async (ctx: Context): Promise<void> => {
    try {
      const profile = await fusionController.getUserProfile(ctx.session);
      if (!!profile) {
        ctx.status = profile.status;
        ctx.body = profile.data;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving user profile';
    }
  }
);

/**
 * Retrieve Hubs
 */
router.get(
  '/hubs',
  async (ctx: Context): Promise<void> => {
    try {
      const hubs = await fusionController.getHubs(ctx.session);
      if (!!hubs) {
        ctx.status = hubs.status;
        ctx.body = hubs.data;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving hubs';
    }
  }
);

/**
 * Retrieve Project
 */
router.get(
  '/hubs/:hubId/projects/:projectId',
  async (ctx: Context): Promise<void> => {
    try {
      const params = ctx.params as { hubId: string; projectId: string };
      const project = await fusionController.getProject(ctx.session, params.hubId, params.projectId);
      if (!!project) {
        ctx.status = project.status;
        ctx.body = project.data;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving project';
    }
  }
);

/**
 * Retrieve Projects
 */
router.get(
  '/hubs/:hubId/projects',
  async (ctx: Context): Promise<void> => {
    try {
      const params = ctx.params as { hubId: string };
      const projects = await fusionController.getProjects(ctx.session, params.hubId);
      if (!!projects) {
        ctx.status = projects.status;
        ctx.body = projects.data;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving projects';
    }
  }
);

/**
 * Retrieve Top Folders
 */
router.get(
  '/hubs/:hubId/projects/:projectId/topFolders',
  async (ctx: Context): Promise<void> => {
    try {
      const params = ctx.params as { hubId: string; projectId: string };
      const folders = await fusionController.getTopFolders(ctx.session, params.hubId, params.projectId);
      if (!!folders) {
        ctx.status = folders.status;
        ctx.body = folders.data;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving top folders';
    }
  }
);

/**
 * Retrieve Folder Contents
 */
router.get(
  '/projects/:projectId/folders/:folderId/contents',
  async (ctx: Context): Promise<void> => {
    try {
      const params = ctx.params as { folderId: string; projectId: string };
      const folderContents = await fusionController.getFolderContents(
        ctx.session,
        params.projectId,
        params.folderId
      );
      if (!!folderContents) {
        ctx.status = 200;
        ctx.body = folderContents;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving folder contents';
    }
  }
);

/**
 * Retrieve Item Version Details
 */
router.get(
  '/projects/:projectId/versions/:versionId',
  async (ctx: Context): Promise<void> => {
    try {
      const params = ctx.params as { projectId: string; versionId: string };
      const version = await fusionController.getItemVersionInfo(
        ctx.session,
        params.projectId,
        params.versionId
      );
      if (!!version) {
        ctx.status = 200;
        ctx.body = version;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving item version details';
    }
  }
);

/**
 * Returns a collection of supported file formats
 * this version could be converted to and downloaded as
 */
router.get(
  '/projects/:projectId/versions/:versionId/formats',
  async (ctx: Context): Promise<void> => {
    try {
      const params = ctx.params as { projectId: string; versionId: string };
      const formats = await fileHelper.downloadFormats(ctx.session, params.projectId, params.versionId);
      if (!!formats) {
        ctx.status = formats.status;
        ctx.body = formats.data;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving supported file formats';
    }
  }
);

/**
 * Retrieve Item Versions
 */
router.get(
  '/projects/:projectId/items/:itemId/versions',
  async (ctx: Context): Promise<void> => {
    try {
      const params = ctx.params as { itemId: string; projectId: string };
      const versions = await fusionController.getItemVersions(ctx.session, params.projectId, params.itemId);
      if (!!versions) {
        ctx.status = versions.status;
        ctx.body = versions.data;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving item versions';
    }
  }
);

/**
 * Retrieve Version Refs
 */
router.get(
  '/projects/:projectId/versions/:versionId/refs',
  async (ctx: Context): Promise<void> => {
    try {
      const params = ctx.params as { projectId: string; versionId: string };
      const refs = await fusionController.getVersionRefs(ctx.session, params.projectId, params.versionId);
      if (!!refs) {
        ctx.status = refs.status;
        ctx.body = refs.data;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving version references';
    }
  }
);

export default router;
