'use strict';

import Router from '@koa/router';
import { Context, DefaultState, Next } from 'koa';
import log4 from 'koa-log4';
import { Publish } from '../controllers/publish';
import { WebHooks } from '../controllers/webhooks';
import { IWebHookCallback } from '../../shared/webhooks';

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
      const params = ctx.params as { hookId: string };
      const webhook = await webHooksController.deleteWebHook(params.hookId);
      if (!!webhook) {
        ctx.status = webhook.status;
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
      const webhooks = await webHooksController.getWebHooks();
      if (!!webhooks) {
        ctx.status = webhooks.status;
        ctx.body = webhooks.data;
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
      const webhook = await webHooksController.setWebHook();
      if (!!webhook) {
        ctx.status = webhook.status;
        ctx.body = webhook.data;
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
      if (ctx.request.body) {
        const callback = ctx.request.body as IWebHookCallback;
        if (callback.payload.Payload.status === 'success') {
          logger.info('... translation completed, finalizing the publishing job');
          void publishController.finalizePublishJob(callback.payload.URN);
        }
      }
      void next();
    } catch (err) {
      logger.error(err);
    }
});

export default router;
