const axios = require('axios')
const logger = require('koa-log4').getLogger('fusion')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }
const url = require('url')

axios.defaults.withCredentials = true
axios.defaults.crossDomain = true

const handleError = require('../helpers/error-handler')
const Token = require('../auth/token')

const config = require('config')

const { getFileFormatToggles } = require('./admin')
const { getToken } = require('../helpers/auth')

let ret = {
  status: 520,
  message: 'Unknown Error'
}

/**
 * Retrieve folder content
 * @param {*} session 
 * @param {*} projectId 
 * @param {*} folderId 
 * @param {*} retry 
 */
async function getFolderContents(session, projectId, folderId, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const fileFormats = await getFileFormatToggles()
    let filters = 'folders:autodesk.core:Folder,folders:autodesk.bim360:Folder'
    if (fileFormats.status === 200) {
      if (fileFormats.message[0].fileFormatToggles.fusion) {
        filters += ',items:autodesk.fusion360:Design'
      }
      if (fileFormats.message[0].fileFormatToggles.creo 
        || fileFormats.message[0].fileFormatToggles.dwg
        || fileFormats.message[0].fileFormatToggles.fbx
        || fileFormats.message[0].fileFormatToggles.inventor 
        || fileFormats.message[0].fileFormatToggles.navisworks
        || fileFormats.message[0].fileFormatToggles.obj
        || fileFormats.message[0].fileFormatToggles.solidworks
        || fileFormats.message[0].fileFormatToggles.step) {
        filters += ',items:autodesk.core:File,items:autodesk.bim360:File'
      }
    }
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.axios_timeout,
      url: `${config.get('API_data_host')}/projects/${projectId}/folders/${folderId}/contents?filter[extension.type]=${filters}`
    })
    if (res.status === 200) {
      const items = {}
      items.data = []
      const folderDocs = res.data.data.filter(item => {
        return item.type === 'folders'
      })
      items.data.push(...folderDocs)
      if (fileFormats.message[0].fileFormatToggles.creo) {
        const creoDocs = res.data.data.filter(item => {
          return item.type === 'items' 
            && (item.attributes.displayName.toLowerCase().endsWith('.asm')
            || item.attributes.displayName.toLowerCase().endsWith('.drw')
            || item.attributes.displayName.toLowerCase().endsWith('.prt'))
        })
        items.data.push(...creoDocs)
      }
      if (fileFormats.message[0].fileFormatToggles.dwg) {
        const dwgDocs = res.data.data.filter(item => {
          return item.type === 'items'
            && item.attributes.displayName.toLowerCase().endsWith('.dwg')
        })
        items.data.push(...dwgDocs)
      }
      if (fileFormats.message[0].fileFormatToggles.fbx) {
        const fbxDocs = res.data.data.filter(item => {
          return item.type === 'items' 
            && item.attributes.displayName.toLowerCase().endsWith('.fbx')
        })
        items.data.push(...fbxDocs)
      }
      if (fileFormats.message[0].fileFormatToggles.fusion) {
        const fusionDocs = res.data.data.filter(item => {
          return item.attributes.extension.type === 'items:autodesk.fusion360:Design'
        })
        items.data.push(...fusionDocs)
      }
      if (fileFormats.message[0].fileFormatToggles.inventor) {
        const inventorDocs = res.data.data.filter(item => {
          return item.type === 'items' 
            && (item.attributes.displayName.toLowerCase().endsWith('.iam')
            || item.attributes.displayName.toLowerCase().endsWith('.idw')
            || item.attributes.displayName.toLowerCase().endsWith('.ipt'))
        })
        items.data.push(...inventorDocs)
      }
      if (fileFormats.message[0].fileFormatToggles.navisworks) {
        const navisworksDocs = res.data.data.filter(item => {
          return item.type === 'items' 
            && item.attributes.displayName.toLowerCase().endsWith('.nwd')
        })
        items.data.push(...navisworksDocs)
      }
      if (fileFormats.message[0].fileFormatToggles.obj) {
        const objDocs = res.data.data.filter(item => {
          return item.type === 'items' 
            && item.attributes.displayName.toLowerCase().endsWith('.obj')
        })
        items.data.push(...objDocs)
      }
      if (fileFormats.message[0].fileFormatToggles.solidworks) {
        const solidworksDocs = res.data.data.filter(item => {
          return item.type === 'items' 
            && (item.attributes.displayName.toLowerCase().endsWith('.sldasm')
            || item.attributes.displayName.toLowerCase().endsWith('.slddrw')
            || item.attributes.displayName.toLowerCase().endsWith('.sldprt'))
        })
        items.data.push(...solidworksDocs)
      }
      if (fileFormats.message[0].fileFormatToggles.step) {
        const stepDocs = res.data.data.filter(item => {
          return item.type === 'items' 
            && (item.attributes.displayName.toLowerCase().endsWith('.step')
            || item.attributes.displayName.toLowerCase().endsWith('.stp'))
        })
        items.data.push(...stepDocs)
      }
      ret = {
        status: 200,
        message: items
      }
    }
    return ret
  } catch (err) {
    retry++
    if (retry < 3) {
      await getFolderContents(session, projectId, folderId, retry)
    }
    return handleError(err)
  }
}

/**
 * Retrieves Hubs
 * @param {*} session 
 * @param {*} retry 
 */
async function getHubs(session, retry = 0) {
  try {
    const tokenSession = new Token(session)
    if (!tokenSession._session.passport) {
      logger.error('... Found empty passport session')
      throw new Error('Found empty passport session')
    }
    // Limit to A360 Teams hubs & BIM360 Docs only (no personal hubs allowed)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.get('axios_timeout'),
      url: `${config.get('API_project_host')}/hubs?filter[extension.type]=hubs:autodesk.core:Hub&filter[extension.type]=hubs:autodesk.bim360:Account`
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
      await getHubs(session, retry)
    }
    return handleError(err)
  }
}

/**
 * Retrieve Information about the Item Version
 * @param {*} session 
 * @param {*} projectId 
 * @param {*} versionId 
 * @param {*} retry 
 */
async function getItemVersionInfo(session, projectId, versionId, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.axios_timeout,
      url: `${config.get('API_data_host')}/projects/${projectId}/versions/${encodeURIComponent(versionId)}`
    })
    if (res.status === 200) {
      ret = {
        status: 200,
        message: {
          derivativeUrn: res.data.data.relationships.derivatives.data.id,
          designUrn: res.data.data.id,
          fileType: (res.data.data.attributes.fileType) ? res.data.data.attributes.fileType: res.data.data.attributes.extension.type,
          name: res.data.data.attributes.displayName,
          size: res.data.data.attributes.storageSize,
          storageLocation: res.data.data.relationships.storage.data.id
        }
      }
    }
    return ret
  } catch (err) {
    if (retry < 3) {
      retry++
      await getItemVersionInfo(session, projectId, versionId, retry)
    }
    return handleError(err)
  }
}

/**
 * Retrieves item's versions
 * @param {*} session 
 * @param {*} projectId 
 * @param {*} itemId 
 * @param {*} retry 
 */
async function getItemVersions(session, projectId, itemId, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.axios_timeout,
      url: `${config.get('API_data_host')}/projects/${projectId}/items/${itemId}/versions`
    })
    if (res.status === 200) {
      ret = {
        status: 200,
        message: res.data.data
      }
    }
    return ret
  } catch (err) {
    retry++
    if (retry < 3) {
      await getItemVersions(session, projectId, itemId, retry)
    }
    return handleError(err)
  }
}

/**
 * Get Project Information
 * @param {*} session 
 * @param {*} hubId 
 * @param {*} projectId 
 * @param {*} retry 
 */
async function getProject(session, hubId, projectId, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.axios_timeout,
      url: `${config.get('API_project_host')}/hubs/${hubId}/projects/${projectId}`
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
      await getProject(session, hubId, projectId, retry)
    }
    return handleError(err)
  }
}

/**
 * Retrieves Projects for a specific Hub
 * @param {Re} session 
 * @param {*} hubId 
 * @param {*} retry 
 */
async function getProjects(session, hubId, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.axios_long_timeout,
      url: `${config.get('API_project_host')}/hubs/${hubId}/projects`
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
      await getProjects(session, hubId, retry)
    }
    return handleError(err)
  }
}

/**
 * Returns thumbnail data URI
 * @param {*} urn 
 * @param {*} retry 
 */
async function getThumbnail(urn, retry = 0) {
  try {
    const twoLeggedToken = await getToken('viewer')
    const res = await axios({
      headers: {
        Authorization: `Bearer ${twoLeggedToken.message.access_token}`
      },
      method: 'GET',
      responseType: 'arraybuffer',
      url: `${config.get('API_derivative_host')}/designdata/${urn}/thumbnail?width=100&height=100`
    })
    if (res.status === 200) {
      const b64Encoded = Buffer.from(res.data, 'binary').toString('base64')
      const dataUri = `data:image/png;base64,${b64Encoded}`
      ret = {
        status: 200,
        message: dataUri
      }
    }
    return ret
  } catch (err) {
    retry++
    if (retry < 3) {
      await getThumbnail(urn, retry)
    }
    return handleError(err)
  }
}

/**
 * Returns the details of the highest level folders the user has access to for a given project
 * @param {*} session 
 * @param {*} hubId 
 * @param {*} projectId 
 * @param {*} retry 
 */
async function getTopFolders(session, hubId, projectId, retry = 0) {
  try {
    const tokenSession = new Token(session)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.axios_timeout,
      url: `${config.get('API_project_host')}/hubs/${hubId}/projects/${projectId}/topFolders`
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
      await getTopFolders(session, hubId, projectId, retry)
    }
    return handleError(err)
  }
}

/**
 * Retrieves user profile
 * @param {*} session 
 * @param {*} retry 
 */
async function getUserProfile(session, retry = 0) {
  try {
    const tokenSession = new Token(session)
    if (!tokenSession._session.passport) {
      logger.error('... Found empty passport session')
      throw new Error('Found empty passport session')
    }
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      timeout: config.get('axios_timeout'),
      url: url.resolve(config.get('API_data_host'), url.resolve(config.get('userprofile_path'), 'users/@me'))
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
      await getUserProfile(session, retry)
    }
    return handleError(err)
  }
}

/**
 * Retrieve Version Refs
 * We only want children i.e. direction=from
 * @param {*} session 
 * @param {*} projectId 
 * @param {*} versionId 
 * @param {*} retry 
 */
async function getVersionRefs(session, projectId, versionId, retry=0) {
  try {
    const tokenSession = new Token(session)
    const res = await axios({
      headers: {
        Authorization: `Bearer ${tokenSession._session.passport.user.access_token}`
      },
      method: 'GET',
      url: `${config.get('API_data_host')}/projects/${projectId}/versions/${encodeURIComponent(versionId)}/relationships/refs?filter[type]=versions&filter[direction]=from`
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
      await getVersionRefs(session, projectId, versionId, retry)
    }
    return handleError(err)
  }
}

// add the methods to the module export
module.exports = {
  getFolderContents,
  getHubs,
  getItemVersionInfo,
  getItemVersions,
  getProject,
  getProjects,
  getThumbnail,
  getTopFolders,
  getUserProfile,
  getVersionRefs
}