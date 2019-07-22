const logger = require('koa-log4').getLogger('handle-error')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

function handleError(err) {
    let ret
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls outside of the range of 2xx
      logger.error(`Error data: ${JSON.stringify(err.response.data)}`)
      ret = {
        status: err.response.status,
        message: err.response.data
      }
    } else if (err.request) {
      // The request was made but no response was received
      // err.request is an instance of http.ClientRequest in Node.js
      logger.error(`Request error: ${err.request}`)
      logger.error(`Request error message: ${err.message}`)
      ret = {
        status: 204,
        message: err.request
      }
    } else {
      // Something happened in setting up the request that triggered an error.
      logger.error('Error', err.message)
      if (err.message === 'Found empty passport session') {
        ret = {
          status: 401,
          message: err.message
        }
      } else {
        ret = {
          status: 500,
          message: err.message
        }
      }
    }
    return ret
  }
  
  module.exports = handleError
  