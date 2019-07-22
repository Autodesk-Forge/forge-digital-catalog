'use strict'

class Token {
  constructor (session) {
    this._session = session
  }

  /**
 * The Forge oAuth2 client JSON template
 */
  getOAuthTemplate () {
    return {
      'authentication': {
        'authorizationUrl': '/authentication/v1/authorize',
        'tokenUrl': '/authentication/v1/gettoken',
        'refreshTokenUrl': '/authentication/v1/refreshtoken',
        'scopes': {
          'data:read': 'The application will be able to read the end user’s data within the Autodesk ecosystem.',
          'data:write': 'The application will be able to create, update, and delete data on behalf of the end user within the Autodesk ecosystem.',
          'data:create': 'The application will be able to create data on behalf of the end user within the Autodesk ecosystem.',
          'data:search': 'The application will be able to search the end user’s data within the Autodesk ecosystem.',
          'bucket:create': 'The application will be able to create an OSS bucket it will own.',
          'bucket:read': 'The application will be able to read the metadata and list contents for OSS buckets that it has access to.',
          'bucket:update': 'The application will be able to set permissions and entitlements for OSS buckets that it has permission to modify.',
          'bucket:delete': 'The application will be able to delete a bucket that it has permission to delete.',
          'code:all': 'The application will be able to author and execute code on behalf of the end user (e.g., scripts processed by the Design Automation API).',
          'account:read': 'For Product APIs, the application will be able to read the account data the end user has entitlements to.',
          'account:write': 'For Product APIs, the application will be able to update the account data the end user has entitlements to.',
          'user-profile:read': 'The application will be able to read the end user’s profile data.',
          'viewables:read': 'The application will have read access to viewable resources such as thumbnails. This scope is a subset of data:read.'
        }
      },
      'authName': 'oauth2_access_code',
      'clientId': '',
      'clientSecret': '',
      'credentials': {
        'expires_at': 0
      },
      'autoRefresh': false,
      'basePath': 'https://developer.api.autodesk.com',
      'scope': 'data:read data:write data:create data:search bucket:create bucket:read bucket:update bucket:delete',
      'redirectUri': ''
    }
  }

  getForgeSession () {
  // reconstruct JSON structure per template
    let forgeSession = {
      session: {
        passport: {
          user: this._session.passport.user
        },
        oauth2: {
          forge: this.getOAuthTemplate()
        }
      }
    }
    forgeSession.session.oauth2.forge.clientId = this._session.forge.oauth2.client_id
    forgeSession.session.oauth2.forge.clientSecret = this._session.forge.oauth2.client_secret
    forgeSession.session.oauth2.forge.credentials.expires_at = this._session.forge.oauth2.expires_at
    forgeSession.session.oauth2.forge.autoRefresh = this._session.forge.oauth2.auto_refresh
    forgeSession.session.oauth2.forge.scope = this._session.forge.oauth2.scope
    forgeSession.session.oauth2.forge.redirectUri = this._session.forge.oauth2.redirect_uri
    return forgeSession
  }

  /**
 * The Forge session has following JSON structure
 *
 * {
 *   session: {
 *     oauth2: {
 *       auto_refresh: <Boolean>,
 *       client_id: <String>,
 *       client_secret: <String>,
 *       expires_at: <String>,
 *       redirect_uri: <String>,
 *       scope: <Array>
 *     }
 *   }
 * }
 */
  setForgeSession (forgeSession) {
    this._session.forge = forgeSession
  }

  get isAuthorized () {
  // !! converts value into boolean
    return (!!this._session.passport.user)
  }
}
module.exports = Token // eslint-enable no-use-before-define
