import * as config from 'config';
import { AuthClientThreeLegged, AuthClientTwoLegged, AuthToken, Scope } from 'forge-apis';
import { Context } from 'koa';
import * as log4 from 'koa-log4';
import { Token } from '../auth/token';
import { ErrorHandler } from './error-handler';

const logger = log4.getLogger('auth-handler');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

export class AuthHelper {

  private auth2Leg!: AuthClientTwoLegged;
  private auth3Leg!: AuthClientThreeLegged;
  private errorHandler: ErrorHandler;

  constructor() {
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Generates a 2-legged bearer token
   * @param scope
   */
  async createInternalToken(scope: Scope[]): Promise<AuthToken | undefined> {
    try {
      if (!this.auth2Leg) {
        this.auth2Leg = new AuthClientTwoLegged(
          config.get('oauth2.clientID'),
          config.get('oauth2.clientSecret'),
          scope,
          true
        );
      }
      const token = await this.auth2Leg.authenticate();
      if (token) { return token; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Refreshes a 3-legged bearer token
   * @param req
   */
  async refreshToken(
    refreshToken: string,
    session: Context['session']
  ): Promise<Context['session'] | undefined> {
    try {
      if (!this.auth3Leg) {
        this.auth3Leg = new AuthClientThreeLegged(
          config.get('oauth2.clientID'),
          config.get('oauth2.clientSecret'),
          config.get('oauth2.callbackURL'),
          config.get('bucket_scope'),
          true
        );
      }
      const token = new Token(session);
      const forgeSession = token.getForgeSession();
      if (forgeSession) {
        const publicCredentials = await this.auth3Leg.refreshToken({
          access_token: forgeSession.session.passport.user.access_token,
          expires_in: forgeSession.session.passport.user.expires_in,
          refresh_token: refreshToken,
          token_type: forgeSession.session.passport.user.token_type
        });
        const now = new Date();
        if (session) {
          session.expires_at = now.setSeconds(now.getSeconds() + publicCredentials.expires_in);
          session.publicToken = publicCredentials.access_token;
          session.refreshToken = publicCredentials.refresh_token;
          return session;
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

}
