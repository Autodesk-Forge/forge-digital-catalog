import { deserializeUser, serializeUser, use } from 'koa-passport';
import { Strategy, VerifyCallback } from 'passport-oauth2';

import config from 'config';
import { Authenticator } from 'passport';

const OAuth2Strategy = Strategy;

/**
 * Initiate 3-legged OAuth 2.0 Forge Strategy
 *
 * The configuration must be generated first
 * by running the script `npm run init`
 */
use(
  new OAuth2Strategy(
    config.get('oauth2'),
    (accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): void => {
      if (accessToken && refreshToken) {
        const tokens = { access_token: accessToken, refresh_token: refreshToken };
        done(null, tokens);
      } else {
        done(undefined, undefined, { message: 'An error occurred!' });
      }
    }
  )
);

serializeUser(
  (user: Express.User, done: (err: any, id?: Authenticator | undefined) => void): void => {
    const userInfo = user as Authenticator;
    done(null, userInfo);
  }
);

deserializeUser(
  (id: Authenticator, done: (err: any, user?: Express.User) => void): void => {
    done(null, id);
  }
);
