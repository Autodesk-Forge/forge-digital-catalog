'use strict';

import config from './default.json';
import { promises as fs } from 'fs';
import url from 'url';
import validator from 'validator';

const init = async (): Promise<void> => {
  try {
    if (!process.env.DEPLOY_TARGET) {
      throw new Error('DEPLOY_TARGET is not set.');
    }
    if (!process.env.FORGE_CALLBACK_URL) {
      throw new Error('FORGE_CALLBACK_URL is not set.');
    }
    if (!process.env.FORGE_CALLBACK_URL.includes('localhost') && !validator.isURL(process.env.FORGE_CALLBACK_URL)) {
      throw new Error('FORGE_CALLBACK_URL is not a valid url.');
    }
    if (!process.env.FORGE_CLIENT_ID) {
      throw new Error('FORGE_CLIENT_ID is not set.');
    }
    if (!process.env.FORGE_CLIENT_SECRET) {
      throw new Error('FORGE_CLIENT_SECRET is not set.');
    }
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set.');
    }
    if (!process.env.NODE_ENV) {
      throw new Error('NODE_ENV is not set.');
    }
    if (['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
      const configPath = `./config/${process.env.NODE_ENV}.json`;
      let deployTarget = 'localhost';
      if (['heroku', 'aws', 'azure'].includes(process.env.DEPLOY_TARGET)) {
        deployTarget = process.env.DEPLOY_TARGET;
      }
      config.bucket_key = `digital-catalog-${deployTarget}-${process.env.NODE_ENV}`;
      config.db.url = process.env.MONGODB_URI;
      config.deployTarget = deployTarget;
      config.oauth2.authorizationURL = process.env.FORGE_AUTH_URL || config.oauth2.authorizationURL;
      config.oauth2.callbackURL = process.env.FORGE_CALLBACK_URL;
      config.oauth2.clientID = process.env.FORGE_CLIENT_ID;
      config.oauth2.clientSecret = process.env.FORGE_CLIENT_SECRET;
      config.oauth2.tokenURL = process.env.FORGE_TOKEN_URL || config.oauth2.tokenURL;
      config.scope = JSON.parse(process.env.FORGE_SCOPE || config.scope);
      config.vuehost = process.env.VUE_HOST || (process.env.NODE_ENV === 'production' ? 'origin' : config.vuehost);
      config.webhook.workflow = (process.env.NODE_ENV === 'production' ? `${config.webhook.workflow}-production`: `${config.webhook.workflow}-development`);
      const siteUrl = new url.URL(process.env.FORGE_CALLBACK_URL);
      config.webhook.callbackURL = (process.env.NODE_ENV === 'production' ? `${siteUrl.origin}/api/admin/webhook/callback`: 'http://localhost:3000/api/admin/webhook/callback');
      config.API_host = process.env.FORGE_API_HOST || config.API_host;
      config.userprofile_path = process.env.USERPROFILE_PATH || '/userprofile/v1/';
      config.logoutaccount_url = process.env.LOGOUTACCOUNT_URL || config.logoutaccount_url;
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      console.info(`New configuration file has been created at ${configPath}`);
    }
  } catch (err) {
    console.error(err);
  }
};

init().then(() => {
  console.info('finished');
}).catch(() => {
  console.error('finished with errors');
});
