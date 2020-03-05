'use strict';

export default {
  API_thumbnails_host: 'https://developer.api.autodesk.com/viewingservice/v1/thumbnails',
  helphost: 'https://autodesk-forge.github.io/forge-digital-catalog',
  koahost: process.env.VUE_APP_KOA_HOST === 'origin' ? location.origin : (process.env.VUE_APP_KOA_HOST || 'http://localhost:3000'),
  viewerCSSURL: 'https://developer.api.autodesk.com/modelderivative/v2/viewers/style.min.css?v=v7.*',
  viewerScriptURL: 'https://developer.api.autodesk.com/modelderivative/v2/viewers/viewer3D.min.js?v=v7.*'
};
