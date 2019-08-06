const handleError = require('./error-handler')
const logger = require('koa-log4').getLogger('xref-handler')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

const { downloadObject } = require('./oss-handler')

/**
 * Download CAD reference files
 * @param {*} payload 
 * @param {*} retry 
 */
async function downloadCADReferences(session, payload, retry = 0) {
    try {
      const downloadPromises = await Promise.all(payload.refs.map(async ref => {
        const refBucketKey = ref.location.split('/')[0].split(':')[3]
        const refObjectName = ref.location.split('/')[1]
        const srcFileName = ref.name
        const downloadRefPromise = await downloadObject(session, refBucketKey, refObjectName, srcFileName)
        if( downloadRefPromise.status === 200) {
          if (ref.hasOwnProperty('children') && ref.children.length > 0) {
            let childPayload = {}
            childPayload.refs = ref.children
            await downloadCADReferences(session, childPayload, retry = 0)
          }
          return downloadRefPromise
        }
      }))
      return downloadPromises
    } catch (err) {
      if (retry < 3) {
        await downloadCADReferences(session, payload, retry++)
      }
      return handleError(err)
    }
}

/**
 * Creates list of CAD files to archive
 * @param {*} payload 
 * @param {*} retry 
 */
function setCADReferenceFilesList(payload, retry = 0) {
    try {
      return payload.refs.reduce((fileNames, ref) => {
        fileNames.push(ref.name)
        if (ref.hasOwnProperty('children') && ref.children.length > 0) {
          let childPayload = {}
          childPayload.refs = ref.children
          fileNames = fileNames.concat(setCADReferenceFilesList(childPayload, retry = 0))
        }
        return fileNames
      }, [])
    } catch (err) {
      if (retry < 3) {
        setCADReferenceFilesList(payload, retry++)
      }
      return handleError(err)
    }
}

module.exports = {
  downloadCADReferences,
  setCADReferenceFilesList
}