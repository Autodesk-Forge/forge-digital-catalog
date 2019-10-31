const axios = require('axios')
const logger = require('koa-log4').getLogger('catalog')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

axios.defaults.withCredentials = true
axios.defaults.crossDomain = true

const CatalogDb = require('../models/catalog')
const handleError = require('../helpers/error-handler')

let ret = {
  status: 520,
  message: 'Unknown Error'
}

async function deleteCatalogFile(body) {
  try {
    const catalogFile = await CatalogDb.deleteOne({
      isFile: true,
      name: body.name,
      path: body.path
    }).exec()
    if (catalogFile) {
      ret = {
        status: 200,
        message: `Successfully deleted catalog file: ${body.path}${body.name}`
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

async function deleteCatalogFolder(body) {
  try {
    const catalogFolder = await CatalogDb.deleteOne({
      isFile: false,
      name: body.name,
      path: body.path
    }).exec()
    if (catalogFolder) {
      ret = {
        status: 200,
        message: `Successfully deleted catalog folder: ${body.path}${body.name}`
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

function escapeRegExp(text) {
  logger.debug(`Converted ${text} to ${text.replace(/[-[\]{}()*+?.\\^|#]/g, '\\$&')}`)
  return text.replace(/[-[\]{}()*+?.\\^|#]/g, '\\$&')
}

async function deleteCatalogFolderWithContent(body) {
  try {
    const deleteString = escapeRegExp (`${body.path}${body.name},`)
    const deleteQuery = await CatalogDb.deleteMany({

      path: { $regex: deleteString }
    }).exec()
    if (deleteQuery) {
      const catalogFolder = await CatalogDb.deleteOne({
        isFile: false,
        name: body.name,
        path: body.path
      }).exec()
      if (catalogFolder) {
        ret = {
          status: 200,
          message: `Successfully deleted catalog folder and content: ${body.path}${body.name}`
        }
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

async function getCatalogFileById(id) {
  try {
    const catalogFile = await CatalogDb.findById(id).exec()
    if (catalogFile) {
      ret = {
        status: 200,
        message: catalogFile
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

async function getCatalogFileByName(name) {
  try {
    const catalogFile = await CatalogDb.findOne({
      isFile: true,
      name
    }).exec()
    if (catalogFile) {
      ret = {
        status: 200,
        message: catalogFile
      }
    } else if (catalogFile === null) {
      ret = {
        status: 200,
        message: null // No catalog item found
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

async function getCatalogFileByOSSDesignUrn(urn) {
  try {
    const catalogFile = await CatalogDb.findOne({
      isFile: true,
      ossDesignUrn: urn
    }).exec()
    if (catalogFile) {
      ret = {
        status: 200,
        message: catalogFile
      }
    } else if (catalogFile === null) {
      ret = {
        status: 200,
        message: null // No catalog item found
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

async function getCatalogFileBySrcDesignUrn(body) {
  try {
    const catalogFile = await CatalogDb.findOne({
      isFile: true,
      srcDesignUrn: body.urn
    }).exec()
    if (catalogFile) {
      ret = {
        status: 200,
        message: catalogFile
      }
    } else if (catalogFile === null) {
      ret = {
        status: 200,
        message: null // No catalog item found
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

async function getCatalogFile(name, path) {
  try {
    const catalogFile = await CatalogDb.findOne({
      isFile: true,
      name,
      path
    }).exec()
    if (catalogFile) {
      ret = {
        status: 200,
        message: catalogFile
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

/**
 * Retrieve catalog folder by _id
 * @param {*} id
 */
async function getCatalogFolderById(id) {
  try {
    const catalogFolder = await CatalogDb.findById(id).exec()
    if (catalogFolder) {
      ret = {
        status: 200,
        message: catalogFolder
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

async function getCatalogRootFolder() {
  try {
    const rootFolder = await CatalogDb.findOne({
      isFile: false,
      name: 'Root Folder',
      path: null
    }).exec()
    if (rootFolder) {
      ret = {
        status: 200,
        message: rootFolder
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

async function getCatalogChildren(folder) {
  try {
    const searchString = escapeRegExp (`,${folder},$`)
    const catalogChildren = await CatalogDb.find(
      {
        path: { $regex: searchString }
      },
      ['name', 'path', 'isFile', 'isPublished'],
      { name: 1, path: 1 }
    ).exec()
    if (catalogChildren) {
      ret = {
        status: 200,
        message: catalogChildren
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

async function renameCatalogFolder(body) {
  try {
    const catalogFolder = await CatalogDb.findOneAndUpdate(
      {
        isFile: false,
        name: body.name,
        path: body.path
      },
      {
        name: body.newName
      },
      {
        upsert: true
      }
    ).exec()
    if (catalogFolder) {
      const oldNameWithCommas = escapeRegExp(`,${body.name},`)
      const newNameWithCommas = escapeRegExp(`,${body.newName},`)
      const renameFolderQuery = await CatalogDb.find({
        path: { $regex: oldNameWithCommas }
      })
        .cursor()
        .on('data', function(e, i) {
          e.path = e.path.replace(oldNameWithCommas, newNameWithCommas)
          e.save()
        })
      if (renameFolderQuery) {
        ret = {
          status: 200,
          message: `Successfully reanmed catalog folder: ${body.path}${body.name} to ${body.path}${body.newName}`
        }
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

async function setCatalogFile(body) {
  try {
    const duplicateFile = await CatalogDb.find(body).exec()
    if (duplicateFile.length > 0) {
      // return if duplicate file is found
      ret = {
        status: 409,
        message: 'Duplicate Catalog File Found.'
      }
      return ret
    }
    const catalogFile = await CatalogDb.findOneAndUpdate(
      {
        isFile: true,
        name: body.name,
        path: body.path,
        rootFilename: '',
        size: body.size,
        srcDesignUrn: body.urn
      },
      body,
      {
        new: true,
        upsert: true
      }
    ).exec()
    if (catalogFile) {
      ret = {
        status: 200,
        message: catalogFile
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

async function setCatalogFolder(body) {
  try {
    const duplicateFolder = await CatalogDb.find(body).exec()
    if (duplicateFolder.length > 0) {
      // return if duplicate folder is found
      ret = {
        status: 409,
        message: 'Duplicate Catalog Folder Found.'
      }
      return ret
    }
    const folder = new CatalogDb(body)
    folder.save((err, catalogFolder) => {
      if (err) {
        ret = {
          status: 500,
          message: err
        }
      }
      ret = {
        status: 200,
        message: catalogFolder
      }
    })
    return ret
  } catch (err) {
    return handleError(err)
  }
}

async function setCatalogRootFolder() {
  try {
    const rootJson = {
      isFile: false,
      name: 'Root Folder',
      path: null
    }
    const catalogRootFolder = await CatalogDb.findOneAndUpdate(
      rootJson,
      rootJson,
      {
        upsert: true
      }
    ).exec()
    if (catalogRootFolder) {
      ret = {
        status: 200,
        message: catalogRootFolder
      }
    }
    logger.info(`Setting catalog root folder: ${JSON.stringify(ret)}\n`)
    return ret
  } catch (err) {
    return handleError(err)
  }
}

async function updateCatalogFile(payload, ossDesignUrn) {
  try {
    const catalogFile = await CatalogDb.findOneAndUpdate(
      payload,
      {
        ossDesignUrn
      },
      {
        new: true
      }
    ).exec()
    if (catalogFile) {
      ret = {
        status: 200,
        message: catalogFile
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

async function updateCatalogFileGltf(payload, gltf) {
  try {
    const catalogFile = await CatalogDb.findOneAndUpdate(
      payload,
      {
        gltf
      },
      {
        new: true
      }
    ).exec()
    if (catalogFile) {
      ret = {
        status: 200,
        message: catalogFile
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

async function updateCatalogFileRootFilename(payload, rootFilename) {
  try {
    const catalogFile = await CatalogDb.findOneAndUpdate(
      payload,
      {
        rootFilename
      },
      {
        new: true
      }
    ).exec()
    if (catalogFile) {
      ret = {
        status: 200,
        message: catalogFile
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

async function updateCatalogFileSvf(payload, svfUrn) {
  try {
    const catalogFile = await CatalogDb.findOneAndUpdate(
      payload,
      {
        isPublished: true,
        svfUrn
      },
      {
        new: true
      }
    ).exec()
    if (catalogFile) {
      ret = {
        status: 200,
        message: catalogFile
      }
    }
    return ret
  } catch (err) {
    return handleError(err)
  }
}

// add the methods to the module export
module.exports = {
  deleteCatalogFile,
  deleteCatalogFolder,
  deleteCatalogFolderWithContent,
  getCatalogFile,
  getCatalogFileById,
  getCatalogFileByName,
  getCatalogFileByOSSDesignUrn,
  getCatalogFileBySrcDesignUrn,
  getCatalogFolderById,
  getCatalogRootFolder,
  getCatalogChildren,
  renameCatalogFolder,
  setCatalogFile,
  setCatalogFolder,
  setCatalogRootFolder,
  updateCatalogFile,
  updateCatalogFileGltf,
  updateCatalogFileRootFilename,
  updateCatalogFileSvf
}
