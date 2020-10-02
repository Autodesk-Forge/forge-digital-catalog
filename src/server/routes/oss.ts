'use strict';

import Router from '@koa/router';
import config from 'config';
import { Context, DefaultState } from 'koa';
import log4 from 'koa-log4';
import { OssHandler } from '../helpers/oss-handler';

const logger = log4.getLogger('oss');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

const ossHelper = new OssHandler(config.get('oauth2.clientID'), config.get('oauth2.clientSecret'), config.get('bucket_scope'));
const router = new Router<DefaultState, Context>({ prefix: '/api/oss' });

/**
 * Downloads object from OSS bucket
 */
router.get(
  '/download/bucket/:bucketKey/object/:objectKey',
  async (ctx: Context): Promise<void> => {
    try {
      const params = ctx.params as { bucketKey: string; objectKey: string };
      const response = await ossHelper.downloadObject(params.bucketKey, params.objectKey, params.objectKey, ctx.session);
      if (!!response) {
        ctx.status = response.status;
        ctx.body = response.data;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while downloading an object';
    }
  }
);

/**
 * Downloads glTF files from OSS bucket
 */
router.get(
  '/download/gltf/bucket/:bucketKey/object/:objectKey',
  async (ctx: Context): Promise<void> => {
    try {
      const params = ctx.params as { bucketKey: string; objectKey: string };
      const response = await ossHelper.downloadGltfObject(params.bucketKey, params.objectKey, params.objectKey);
      if (!!response) {
        ctx.status = response.status;
        ctx.body = response.data;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while downloading an object';
    }
  }
);

export default router;
