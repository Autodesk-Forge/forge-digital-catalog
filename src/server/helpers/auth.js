const axios = require('axios')
const qs = require('querystring')

const config = require('config')
const handleError = require('./error-handler')

let ret = {
  status: 520,
  message: 'Unknown Error'
}

/**
 * Get three-legged access token
 * @param {*} mode 
 * @param {*} retry 
 */
async function getToken(mode, retry = 0) {
  try {
    const data = {
      client_id: config.get('oauth2.clientID'),
      client_secret: config.get('oauth2.clientSecret'),
      grant_type: 'client_credentials',
      scope: ( (mode === 'viewer') ? config.get('view_scope') : config.get('bucket_scope') ).join(' ')
    }
    const res = await axios({
      data: qs.stringify(data),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      timeout: config.axios_timeout,
      url: `${config.get('API_auth_host')}/authenticate`
    })
    if (res.status === 200) {
      ret = {
        status: 200,
        message: res.data
      }
    }
    return ret
  } catch (err) {
    retry++
    if (retry < 3) {
      await getToken(mode, retry)
    }
    return handleError(err)
  }
}

/**
 * Refreshes the Three-Legged access token
 * @param {*} refreshToken 
 * @param {*} retry 
 */
async function refreshToken(token, retry = 0) {
  try {
    const data = {
      client_id: config.get('oauth2.clientID'),
      client_secret: config.get('oauth2.clientSecret'),
      grant_type: 'refresh_token',
      refresh_token: token
    }
    const res = await axios({
      data: qs.stringify(data),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      url: `${config.get('API_auth_host')}/refreshtoken`
    })
    if (res.status === 200) {
      ret = {
        status: 200,
        message: res.data
      }
    }
    return ret
  } catch (err) {
    retry++
    if (retry < 3) {
      await refreshToken(retry)
    }
    return handleError(err)
  }
}

module.exports = {
  getToken,
  refreshToken
}