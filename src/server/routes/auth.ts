'use strict';

import * as Router from '@koa/router';

import * as config from 'config';
import { Scope } from 'forge-apis';
import { Context, DefaultState, Next } from 'koa';
import * as log4 from 'koa-log4';
import * as passport from 'koa-passport';
import * as url from 'url';
import { IForgeSession } from '../../shared/auth';
import { Token } from '../auth/token';
import { AuthHelper } from '../helpers/auth-handler';

const authHelper = new AuthHelper();

const logger = log4.getLogger('auth');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

const router = new Router<DefaultState, Context>({ prefix: '/api/forge' });

/**
 * Retrieve a two-legged oAuth2 Token
 * mode parameter can either be 'viewer' or 'oss'
 */
router.get(
  '/authenticate/:mode',
  async (ctx: Context): Promise<void> => {
    try {
      const scope: Scope[] = ( (ctx.params.mode === 'viewer') ? config.get('view_scope') : config.get('bucket_scope') );
      const authToken = await authHelper.createInternalToken(scope);
      if (authToken) {
        ctx.status = 200;
        ctx.body = JSON.stringify(authToken);
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while retrieving access token';
    }
  }
);

/**
 * Authenticate
 *
 * Calls the Autodesk authenticate URL
 */
router.get(
  '/authenticate',
  (ctx: Context, next: Next): void => {
    const options = {
      scope: config.get('scope'),
      state: ctx.query.state
    };
    return passport.authenticate(
      'oauth2',
      options,
    )(ctx, next);
  });

/**
 * Get the Forge App Callback
 *
 * Retrieves the access and refresh tokens
 * from the Forge App callback URL
 */
router.get(
  '/callback/oauth',
  (ctx: Context, next: Next): void => {
    return passport.authenticate(
      'oauth2',
      async (err, user) => {
        if (err) { ctx.throw(500, err); }
        const tokenSession = new Token(ctx.session);
        await ctx.login(user);
        const forgeSession: IForgeSession = {
          oauth2: {
            auto_refresh: false,
            client_id: config.get('oauth2.clientID'),
            client_secret: config.get('oauth2.clientSecret'),
            expires_at: '',
            redirect_uri: config.get('oauth2.callbackURL'),
            scope: config.get('scope')
          }
        };
        tokenSession.setForgeSession(forgeSession);
        ctx.redirect(url.resolve(
          config.get('vuehost') === 'origin'
          ? `http://${ctx.req.headers.host}`
          : config.get('vuehost'),
          `/${ctx.query.state}?isAdminUserLoggedIn=true`)
          );
      })(ctx, next);
  });

/**
 * Log out
 *
 * If you need to completely log out from Forge
 * you will need to implement on the client-side
 * the steps documented in the below Forge article
 * https://forge.autodesk.com/blog/log-out-forge
 */
router.get(
  '/logout',
  (ctx: Context): void => {
    try {
      ctx.logout();
      ctx.body = {
        message: 'Log out operation complete',
        success: true
      };
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while logging out';
    }
  }
);

router.get(
  '/logoutaccount',
  (ctx) => ctx.redirect(config.get('logoutaccount_url'))
);

/**
 * Refreshes a Three-Legged access token
 */
router.post(
  '/auth/refreshtoken/:refreshToken',
  async (ctx: Context) => {
    try {
      const session = await authHelper.refreshToken(ctx.params.refreshToken, ctx.session);
      if (session) {
        ctx.status = 200;
        ctx.body = session;
      }
    } catch (err) {
      logger.error(err);
      ctx.status = 500;
      ctx.body = 'A server error occurred while refreshing access tokenD';
    }
  }
);

export default router;
