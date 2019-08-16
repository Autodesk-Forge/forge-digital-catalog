const axios = require('axios')
const config = require('config')
const logger = require('koa-log4').getLogger('webhooks')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

axios.defaults.withCredentials = true
axios.defaults.crossDomain = true

const { getToken } = require('../helpers/auth')
const handleError = require('../helpers/error-handler')

let ret = {
    status: 520,
    message: 'Unknown Error'
}

/**
 * Delete Webhook
 * @param {*} hookId
 * @param {*} retry
 */
async function deleteWebHook(hookId, retry = 0) {
    try {
      const token = await getToken()
      const res = await axios({
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.message.access_token}`
        },
        method: 'DELETE',
        url: `${config.get(
          'API_webhook_host'
        )}/systems/derivative/events/extraction.finished/hooks/${hookId}`
      })
      if (res.status === 200) {
        ret = {
          status: res.status,
          message: res.data
        }
      }
      return ret
    } catch (err) {
      retry++
      if (retry < 3) {
        await deleteWebHook(hookId, retry)
      }
      return handleError(err)
    }
}

/**
 * Retrieves Webhooks
 * @param {*} retry
 */
async function getWebHooks(retry = 0) {
    try {
      const token = await getToken()
      const res = await axios({
        headers: {
          Authorization: `Bearer ${token.message.access_token}`
        },
        method: 'GET',
        url: `${config.get(
          'API_webhook_host'
        )}/systems/derivative/events/extraction.finished/hooks`
      })
      if (res.status === 200) {
        ret = {
          status: res.status,
          message: res.data
        }
      }
      return ret
    } catch (err) {
      retry++
      if (retry < 3) {
        await getWebHooks(retry)
      }
      return handleError(err)
    }
}

/**
 * Creates Model Derivative WebHook
 */
async function setWebHook(retry = 0) {
    try {
      const token = await getToken()
      const callbackUrl = (process.env.NODE_ENV === 'production') ? config.get('webhook.callbackURL') : config.get('ngrok.callbackURL')
      const data = {
        callbackUrl,
        scope: {
          workflow: config.get('webhook.workflow')
        }
      }
      const res = await axios({
        data,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.message.access_token}`
        },
        method: 'POST',
        url: `${config.get(
          'API_webhook_host'
        )}/systems/derivative/events/extraction.finished/hooks`
      })
      if (res.status === 201) {
        ret = {
          status: res.status,
          message: res.data
        }
      }
      return ret
    } catch (err) {
      retry++
      if (retry < 3) {
        await setWebHook(retry)
      }
      return handleError(err)
    }
}

module.exports = {
    deleteWebHook,
    getWebHooks,
    setWebHook
}