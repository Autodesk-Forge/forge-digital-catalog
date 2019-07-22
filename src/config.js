'use strict'

module.exports = {
  API_thumbnails_host: 'https://developer.api.autodesk.com/viewingservice/v1/thumbnails',
  koahost: process.env.VUE_APP_KOA_HOST === 'origin' ? location.origin : (process.env.VUE_APP_KOA_HOST || 'http://localhost:3000')
}