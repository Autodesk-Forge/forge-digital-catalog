'use strict';

import Router from '@koa/router';
import { Context, DefaultState } from 'koa';
import log4 from 'koa-log4';
import url from 'url';
import { Publish } from '../controllers/publish';

const logger = log4.getLogger('publish');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

const publishController = new Publish();
const router = new Router<DefaultState, Context>({ prefix: '/api/admin' });

/**
 * Retrieve the Publisher Logs
 */
router.get('/publish/logs', async (ctx: Context): Promise<void> => {
    try {
      const logs = await publishController.getPublishLogs();
      if (!!logs) {
        ctx.status = 200;
        ctx.body = logs;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving the publisher logs';
    }
});

/**
 * Set Publish Log Entry
 */
router.post('/publish/logs', (ctx: Context): void => {
    try {
      const log = publishController.setPublishLog(ctx.request.body);
      if (!!log) {
        ctx.status = 200;
        ctx.body = log;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while saving new publisher log entry';
    }
});

/**
 * Translate CAD model to SVF
 */
router.post('/translate', async (ctx: Context): Promise<void> => {
    try {
      const job = await publishController.translateJob(ctx.request.body);
      if (!!job) {
        ctx.status = job.status;
        ctx.body = job.data;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred during translation';
    }
});

/**
 * Get Translation Job Status
 */
router.get('/translate/(.*)', async (ctx: Context): Promise<void> => {
    try {
      const requestUrl = url.parse(ctx.request.url);
      const newUrl = requestUrl.pathname;
      if (newUrl) {
        const base64Urn = encodeURIComponent(
          newUrl.replace('/api/admin/translate/', '')
        );
        const status = await publishController.getTranslateJobStatus(base64Urn);
        if (!!status) {
          ctx.status = 200;
          ctx.body = status;
        }
      }

    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving translation status';
    }
});

export default router;
