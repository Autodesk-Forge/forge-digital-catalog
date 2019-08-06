const passport = require('koa-passport')
const OAuth2Strategy = require('passport-oauth2').Strategy

const config = require('config')

/**
 * Initiate 3-legged OAuth 2.0 Forge Strategy
 *
 * The configuration must be generated first
 * by running the script `npm run init`
 */
passport.use(
  new OAuth2Strategy(
    config.get('oauth2'),
    (accessToken, refreshToken, profile, done) => {
      if (accessToken && refreshToken) {
        const tokens = { access_token: accessToken, refresh_token: refreshToken }
        done(null, tokens)
      } else {
        done('An error occurred!')
      }
    }
  )
)

passport.serializeUser(
  (user, done) => {
    done(null, user)
  }
)

passport.deserializeUser(
  (user, done) => {
    done(null, user)
  }
)
