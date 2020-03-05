'use strict';

import { Context } from 'koa';
import { IForgeSession } from '../../shared/auth';

export class Token {

  public session: Context['session'];

  constructor(session: Context['session']) {
    this.session = session;
  }

  public getForgeSession() {
    // reconstruct JSON structure per template
    if (this.session) {
      const forgeSession = {
        session: {
          oauth2: {
            forge: this.getOAuthTemplate()
          },
          passport: {
            user: this.session.passport.user
          }
        }
      };
      forgeSession.session.oauth2.forge.clientId = this.session.forge.oauth2.client_id;
      forgeSession.session.oauth2.forge.clientSecret = this.session.forge.oauth2.client_secret;
      forgeSession.session.oauth2.forge.credentials.expires_at = this.session.forge.oauth2.expires_at;
      forgeSession.session.oauth2.forge.autoRefresh = this.session.forge.oauth2.auto_refresh;
      forgeSession.session.oauth2.forge.scope = this.session.forge.oauth2.scope;
      forgeSession.session.oauth2.forge.redirectUri = this.session.forge.oauth2.redirect_uri;
      return forgeSession;
    }
  }

  public setForgeSession(forgeSession: IForgeSession): void {
    if (this.session) { this.session.forge = forgeSession; }
  }

  get isAuthorized() {
    // !! converts value into boolean
    if (this.session) { return (!!this.session.passport.user); }
  }

  /**
   * The Forge oAuth2 client JSON template
   */
  private getOAuthTemplate() {
    return {
      authName: 'oauth2_access_code',
      authentication: {
        authorizationUrl: '/authentication/v1/authorize',
        refreshTokenUrl: '/authentication/v1/refreshtoken',
        scopes: {
          'account:read': 'For Product APIs, the application will be able to read the account data the end user has entitlements to.',
          'account:write': 'For Product APIs, the application will be able to update the account data the end user has entitlements to.',
          'bucket:create': 'The application will be able to create an OSS bucket it will own.',
          'bucket:delete': 'The application will be able to delete a bucket that it has permission to delete.',
          'bucket:read': 'The application will be able to read the metadata and list contents for OSS buckets that it has access to.',
          'bucket:update': 'The application will be able to set permissions and entitlements for OSS buckets that it has permission to modify.',
          'code:all': 'The application will be able to author and execute code on behalf of the end user (e.g., scripts processed by the Design Automation API).',
          'data:create': 'The application will be able to create data on behalf of the end user within the Autodesk ecosystem.',
          'data:read': 'The application will be able to read the end user’s data within the Autodesk ecosystem.',
          'data:search': 'The application will be able to search the end user’s data within the Autodesk ecosystem.',
          'data:write': 'The application will be able to create, update, and delete data on behalf of the end user within the Autodesk ecosystem.',
          'user-profile:read': 'The application will be able to read the end user’s profile data.',
          'viewables:read': 'The application will have read access to viewable resources such as thumbnails. This scope is a subset of data:read.'
        },
        tokenUrl: '/authentication/v1/gettoken'
      },
      autoRefresh: false,
      basePath: 'https://developer.api.autodesk.com',
      clientId: '',
      clientSecret: '',
      credentials: {
        expires_at: 0
      },
      redirectUri: '',
      scope: 'data:read data:write data:create data:search bucket:create bucket:read bucket:update bucket:delete'
    };
  }

}
