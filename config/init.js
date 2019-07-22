'use strict'

const config = require('./default.json')
const fs = require('fs')
const URL = require('url').URL
const validator = require('validator')

if (!validator.isURL(process.env.FORGE_CALLBACK_URL)) {
  throw new Error('FORGE_CALLBACK_URL is not a valid url')
}

if (['development', 'production', 'test'].indexOf(process.env.NODE_ENV)  > -1) {
  const configPath = `./config/${process.env.NODE_ENV}.json`
  let deployTarget = 'localhost'
  if (['heroku', 'aws', 'azure'].indexOf(process.env.DEPLOY_TARGET) > -1) {
    deployTarget = process.env.DEPLOY_TARGET
  }
  config.bucket_key = `digital-catalog-${deployTarget}-${process.env.NODE_ENV}`
  config.db.url = process.env.MONGODB_URI
  config.deployTarget = deployTarget
  config.oauth2.authorizationURL = process.env.FORGE_AUTH_URL || config.oauth2.authorizationURL
  config.oauth2.callbackURL = process.env.FORGE_CALLBACK_URL
  config.oauth2.clientID = process.env.FORGE_CLIENT_ID
  config.oauth2.clientSecret = process.env.FORGE_CLIENT_SECRET
  config.oauth2.tokenURL = process.env.FORGE_TOKEN_URL || config.oauth2.tokenURL
  config.scope = JSON.parse(process.env.FORGE_SCOPE || config.scope)
  config.vuehost = process.env.VUE_HOST || (process.env.NODE_ENV === 'production' ? 'origin' : config.vuehost)
  config.webhook.workflow = (process.env.NODE_ENV === 'production' ? `${config.webhook.workflow}-production`: `${config.webhook.workflow}-development`)
  const siteUrl = new URL(process.env.FORGE_CALLBACK_URL)
  config.webhook.callbackURL = (process.env.NODE_ENV === 'production' ? `${siteUrl.origin}/api/admin/webhook/callback`: 'http://localhost:3000/api/admin/webhook/callback')

  config.API_host = process.env.FORGE_API_HOST || config.API_host
  config.userprofile_path = process.env.USERPROFILE_PATH || '/userprofile/v1/'
  config.logoutaccount_url = process.env.LOGOUTACCOUNT_URL || config.logoutaccount_url

  fs.writeFile(
    configPath,
    JSON.stringify(config, null, 2),
    err => {
      if (err) {
        console.error(err)
        return
      }
      console.info(`New configuration file has been created at ${configPath}`)
  })
} else {
  console.error('NODE_ENV is not set.')
}
/* eslint-disable no-use-before-define */
module.exports = config //
/* eslint-enable no-use-before-define */