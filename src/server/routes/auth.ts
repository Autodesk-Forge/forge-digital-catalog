'use strict';

import Router from '@koa/router';

import config from 'config';
import { Scope } from 'forge-apis';
import { Context, DefaultState, Next } from 'koa';
import log4 from 'koa-log4';
import passport from 'koa-passport';
import url from 'url';
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
      const params = ctx.params as { mode: string };
      const scope: Scope[] = ( (params.mode === 'viewer') ? config.get('view_scope') : config.get('bucket_scope') );
      const authToken = await authHelper.createInternalToken(scope);
      if (!!authToken) {
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
    const query = ctx.query as { state: string };
    const options = {
      scope: config.get('scope'),
      state: query.state
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
        const host = ctx.req.headers.host as string;
        const query = ctx.query as { code: string; state: string };
        const relativeUrl = `/${query.state}?isAdminUserLoggedIn=true`;
        ctx.redirect(url.resolve(
          config.get('vuehost') === 'origin'
          ? `http://${host}`
          : config.get('vuehost'), relativeUrl)
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
      const params = ctx.params as { refreshToken: string };
      const session = await authHelper.refreshToken(params.refreshToken, ctx.session);
      if (!!session) {
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
