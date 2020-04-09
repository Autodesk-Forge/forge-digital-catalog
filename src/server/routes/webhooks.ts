'use strict';

import Router from '@koa/router';
import { Context, DefaultState, Next } from 'koa';
import log4 from 'koa-log4';
import { Publish } from '../controllers/publish';
import { WebHooks } from '../controllers/webhooks';

const logger = log4.getLogger('webhooks');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

const publishController = new Publish();
const router = new Router<DefaultState, Context>({ prefix: '/api/admin' });
const webHooksController = new WebHooks();

/**
 * Delete System WebHook
 */
router.delete('/webhooks/:hookId', async (ctx: Context): Promise<void> => {
    try {
      const response = await webHooksController.deleteWebHook(ctx.params.hookId);
      if (!!response) {
        ctx.status = response.status;
        ctx.body = response.data;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while deleting a WebHook';
    }
});

/**
 * Get System WebHooks
 */
router.get('/webhooks', async (ctx: Context): Promise<void> => {
    try {
      const response = await webHooksController.getWebHooks();
      if (!!response) {
        ctx.status = response.status;
        ctx.body = response.data;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving the WebHooks';
    }
});

/**
 * Create WebHook for Model Derivative Events
 */
router.post('/webhooks', async (ctx: Context): Promise<void> => {
    try {
      const response = await webHooksController.setWebHook();
      if (!!response) {
        ctx.status = response.status;
        ctx.body = response.data;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while saving new WebHook';
    }
});

/**
 * Translation Webhook Callback
 */
router.post('/webhook/callback', (ctx: Context, next: Next): void => {
    try {
      ctx.status = 200;
      ctx.body = {};
      if (
        ctx.request.body &&
        ctx.request.body.payload.Payload.status === 'success'
      ) {
        logger.info('... translation completed, finalizing the publishing job');
        publishController.finalizePublishJob(ctx.request.body.payload.URN);
      }
      next();
    } catch (err) {
      logger.error(err);
    }
});

export default router;
