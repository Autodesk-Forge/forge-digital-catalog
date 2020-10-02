'use strict';

import Router from '@koa/router';
import { Context, DefaultState } from 'koa';
import log4 from 'koa-log4';
import { Admin } from '../controllers/admin';

const logger = log4.getLogger('admin');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

const adminController = new Admin();
const router = new Router<DefaultState, Context>({ prefix: '/api/admin' });

/**
 * Get Application Name from Database
 */
router.get('/ApplicationName', async (ctx: Context): Promise<void> => {
  try {
    const settings = await adminController.getSetting('applicationName');
    if (!!settings && settings.length > 0) {
      ctx.status = 200;
      ctx.body = settings;
    }
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
    ctx.body = 'A server error occurred while retrieving the application name';
  }
});

/**
 * Set Application Name in Database
 */
router.post('/ApplicationName', async (ctx: Context): Promise<void> => {
  try {
    const setting = await adminController.setApplicationName(ctx.request.body);
    if (!!setting) {
      ctx.status = 200;
      ctx.body = setting;
    }
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
    ctx.body = 'A server error occurred while setting the application name';
  }
});

/**
 * Get current System Administrators from the Database
 */
router.get('/CompanyLogo', async (ctx: Context): Promise<void> => {
  try {
    const settings = await adminController.getSetting('companyLogo');
    if (!!settings && settings.length > 0) {
      ctx.status = 200;
      ctx.body = settings;
    }
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
    ctx.body = 'A server error occurred while retrieving the company logo';
  }
});

/**
 * Set the System Administrators
 */
router.post('/CompanyLogo', async (ctx: Context): Promise<void> => {
  try {
    const setting = await adminController.setCompanyLogo(ctx.request.body);
    if (!!setting) {
      ctx.status = 200;
      ctx.body = setting;
    }
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
    ctx.body = 'A server error occurred while setting the company logo';
  }
});

/**
 * Set and update default hub project setting
 */
router.post('/default/hub/project', async (ctx: Context): Promise<void> => {
  try {
    const setting = await adminController.setAndUpdateDefaultHubProject(ctx.request.body);
    if (!!setting) {
      ctx.status = 200;
      ctx.body = setting;
    }
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
    ctx.body = 'A server error occurred while setting the default hub and project';
  }
});

/**
 * Get setting by name and email
 */
router.get('/settings/:name/email/:email', async (ctx: Context): Promise<void> => {
  try {
    const params = ctx.params as { email: string; name: string };
    const settings = await adminController.getSettingByNameAndEmail(
      params.name,
      params.email
    );
    if (!!settings) {
      if (settings.length > 0) {
        ctx.status = 200;
        ctx.body = settings;
      } else if (settings.length === 0) {
        ctx.status = 200;
        ctx.body = 'No setting found';
      }
    }
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
    ctx.body = 'A server error occurred while retrieving user settings';
  }
});

/**
 * Set Feature Toggles
 */
router.post('/settings/features', async (ctx: Context): Promise<void> => {
  try {
    const setting = await adminController.setFeatureToggles(ctx.request.body);
    if (!!setting) {
      ctx.status = 200;
      ctx.body = setting;
    }
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
    ctx.body = 'A server error occurred while setting feature toggles';
  }
});

/**
 * Retrieve Feature Toggles
 */
router.get('/settings/features', async (ctx: Context): Promise<void> => {
  try {
    const settings = await adminController.getSetting('featureToggles');
    if (!!settings) {
      ctx.status = 200;
      ctx.body = settings;
    }
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
    ctx.body = 'A server error occurred while retrieving feature toggles';
  }
});

/**
 * Set File Format Toggles
 */
router.post('/settings/fileformats', async (ctx: Context): Promise<void> => {
  try {
    const setting = await adminController.setFileFormatToggles(ctx.request.body);
    if (!!setting) {
      ctx.status = 200;
      ctx.body = setting;
    }
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
    ctx.body = 'A server error occurred while saving file formats';
  }
});

/**
 * Retrieve File Format Toggles
 */
router.get('/settings/fileformats', async (ctx: Context): Promise<void> => {
  try {
    const settings = await adminController.getSetting('fileFormatToggles');
    if (!!settings) {
      ctx.status = 200;
      ctx.body = settings;
    }
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
    ctx.body = 'A server error occurred while retrieving file formats';
  }
});

/**
 * Get current System Administrators from the Database
 */
router.get('/sysadmins', async (ctx: Context): Promise<void> => {
  try {
    const settings = await adminController.getSetting('webAdmins');
    if (!!settings) {
      ctx.status = 200;
      ctx.body = settings;
    }
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
    ctx.body = 'A server error occurred while retrieving web admins';
  }
});

/**
 * Set the System Administrators
 */
router.post('/sysadmins', async (ctx: Context): Promise<void> => {
  try {
    const setting = await adminController.setSysAdmins(ctx.request.body);
    if (!!setting) {
      ctx.status = 200;
      ctx.body = setting;
    }
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
    ctx.body = 'A server error occurred while saving web admins';
  }
});

export default router;
