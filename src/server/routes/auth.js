'use strict'

const logger = require('koa-log4').getLogger('auth')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

const passport = require('koa-passport')
const Router = require('koa-router')

const config = require('config')
const Token = require('../auth/token')

const router = new Router({ prefix: '/api/forge' })
const url = require('url')

const { getToken, refreshToken } = require('../helpers/auth')

/**
 * Retrieve a two-legged oAuth2 Token
 * mode parameter can either be 'viewer' or 'oss'
 */
router.get(
  '/authenticate/:mode',
  async ctx => {
    try {
      const accessToken = await getToken(ctx.params.mode)
      if (accessToken) {
        ctx.status = accessToken.status
        ctx.body = accessToken.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while retrieving access token'
    }
  }
)

/**
 * Authenticate
 *
 * Calls the Autodesk authenticate URL
 */
router.get(
  '/authenticate',
  ctx => { 
    return passport.authenticate(
      'oauth2',
      { 
        scope: config.get('scope'),
        state: ctx.query.state
      }
    )(ctx)
  })

/**
 * Get the Forge App Callback
 *
 * Retrieves the access and refresh tokens
 * from the Forge App callback URL
 */
router.get(
  '/callback/oauth',
  ctx => {
    return passport.authenticate(
      'oauth2',
      async (err, user) => {
        if (err) ctx.throw(500, err)
        const tokenSession = new Token(ctx.session)
        await ctx.login(user)
        let forgeSession = {
          oauth2: {
            auto_refresh: false,
            client_id: config.get('oauth2.clientID'),
            client_secret: config.get('oauth2.clientSecret'),
            expires_at: '',
            redirect_uri: config.get('oauth2.callbackURL'),
            scope: config.get('scope')
          }
        }
        tokenSession.setForgeSession(forgeSession)
        ctx.redirect(url.resolve(
          config.get('vuehost') === 'origin' 
          ? `http://${ctx.req.headers.host}` 
          : config.get('vuehost'), 
          `/${ctx.query.state}?isAdminUserLoggedIn=true`)
          )
      })(ctx)
  })

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
  ctx => {
    try {
      ctx.logout()
      ctx.body = {
        success: true,
        message: 'Log out operation complete'
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while logging out'
    }
  }
)

router.get(
  '/logoutaccount',
  ctx => ctx.redirect(config.get('logoutaccount_url'))
)

/**
 * Refreshes a Three-Legged access token
 */
router.post(
  '/auth/refreshtoken/:refreshToken',
  async ctx => {
    try {
      const token = await refreshToken(ctx.params.refreshToken)
      if (token) {
        ctx.status = token.status
        ctx.body = token.message
      }
    } catch (err) {
      logger.error(err)
      ctx.status = 500
      ctx.body = 'A server error occurred while refreshing access tokenD'
    }
  }
)

module.exports = router // eslint-enable no-use-before-define