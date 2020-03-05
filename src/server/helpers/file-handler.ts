import * as archiver from 'archiver';
import axios, { AxiosResponse } from 'axios';
import * as config from 'config';
import { AuthToken } from 'forge-apis';
import * as fs from 'fs';
import * as zip from 'jszip';
import { Context } from 'koa';
import * as log4 from 'koa-log4';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';
import { IXRef } from '../../shared/publish';
import { Catalog } from '../controllers/catalog';
import { AuthHelper } from './auth-handler';
import { ErrorHandler } from './error-handler';
import { XrefHandler } from './xref-handler';

const logger = log4.getLogger('file-handler');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

export class FileHandler {

  private authHelper: AuthHelper;
  private catalogController: Catalog;
  private errorHandler: ErrorHandler;
  private xrefHandler: XrefHandler;

  constructor() {
    this.authHelper = new AuthHelper();
    this.catalogController = new Catalog();
    this.errorHandler = new ErrorHandler();
    this.xrefHandler = new XrefHandler();
  }

  /**
   * Download the File
   * NOTE: This mechanism can download the Fusion references
   * and have information about the references
   * @param session
   * @param projectId
   * @param versionId
   * @param fileType
   */
  async downloadFile(
    session: Context['session'],
    projectId: string,
    versionId: string,
    fileType: string
  ): Promise<AxiosResponse | undefined> {
    try {
      const payload = {
        data: {
          attributes: {
            format: {
              fileType
            }
          },
          relationships: {
            source: {
              data: {
                id: versionId,
                type: 'versions'
              }
            }
          },
          type: 'downloads'
        },
        jsonapi: {
          version: '1.0'
        }
      };
      if (session) {
        const res = await axios({
          data: payload,
          headers: {
            'Authorization': `Bearer ${session.passport.user.access_token}`,
            'Content-Type': 'application/vnd.api+json'
          },
          method: 'POST',
          timeout: config.get('axios_long_timeout'),
          url: `${config.get('API_data_host')}/projects/${projectId}/downloads`
        });
        if (res.status === 202) { return res.data; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Returns a collection of supported file formats
   * this version could be converted to and downloaded as
   * @param session
   * @param projectId
   * @param versionId
   */
  async downloadFormats(
    session: Context['session'],
    projectId: string,
    versionId: string
  ): Promise<AxiosResponse | undefined> {
    try {
      if (session) {
        const res = await axios({
          headers: {
            Authorization: `Bearer ${session.passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: `${config.get('API_data_host')}/projects/${projectId}/versions/${encodeURIComponent(versionId)}/downloadFormats`
        });
        if (res.status === 200) { return res; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Returns the details for a specific download
   * @param session
   * @param projectId
   * @param downloadId
   */
  async getDownloadInfo(
    session: Context['session'],
    projectId: string,
    downloadId: string
  ): Promise<AxiosResponse | undefined> {
    try {
      if (session) {
        const res = await axios({
          headers: {
            Authorization: `Bearer ${session.passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: `${config.get('API_data_host')}/projects/${projectId}/downloads/${downloadId}`
        });
        if (res.status === 200) { return res.data; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Returns Download Job Information
   * @param session
   * @param href
   */
  async getDownloadJobInfo(session: Context['session'], href: string): Promise<AxiosResponse | undefined> {
    try {
      if (session) {
        const res = await axios({
          headers: {
            Authorization: `Bearer ${session.passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: href
        });
        if (res.status === 200) { return res.data; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Read Manifest.json to retrieve rootFilename
   * @param filePath
   */
  async getRootFileFromManifest(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) throw err;
        zip.loadAsync(data)
          .then((archive) => {
            return archive.file('Manifest.json').async('text');
          })
          .then((rootFilename: string) => {
            logger.info(`... found rootFilename value in Manifest.json: ${rootFilename}`);
            resolve(JSON.parse(rootFilename));
          })
          .catch((loadErr: Error) => {
            reject(loadErr);
          });
      });
    });
  }

  /**
   * Returns Status Information About a Resumable Upload
   * @param token
   * @param bucketKey
   * @param objectName
   * @param sessionId
   */
  async getUploadStatus(
    token: AuthToken,
    bucketKey: string,
    objectName: string,
    sessionId: string
  ): Promise<AxiosResponse | undefined> {
    try {
      const res = await axios({
        headers: {
          Authorization: `Bearer ${token}`
        },
        method: 'GET',
        timeout: config.get('axios_timeout'),
        url: `${config.get('API_oss_host')}/buckets/${bucketKey}/objects/${objectName}/status/${sessionId}`
      });
      if (res.status === 202) { return res; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Move object from A360 / BIM360Docs to OSS bucket
   * @param session
   * @param bucketKey
   * @param objectName
   * @param payload
   */
  async moveObject(
    session: Context['session'],
    bucketKey: string,
    objectName: string,
    payload: any
  ): Promise<any> {
    try {
      let moveOp;
      if (!Array.isArray(payload.refs)) { return; }
      if (payload.refs.length === 0) {
        logger.info(`... preparing to move single object ${objectName}`);
        moveOp = await this.moveSingleObject(session, bucketKey, objectName);
      }
      if (payload.refs.length > 0) {
        logger.info(`... preparing to move object ${objectName} with its references`);
        moveOp = await this.moveObjectWithRefs(session, bucketKey, objectName, payload);
      }
      return moveOp;
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Poll Download Job Info
   * @param session
   * @param href
   */
  async pollDownloadJobInfo(session: Context['session'], href: string): Promise<AxiosResponse | undefined> {
    while (true) {
      try {
        const response = await this.getDownloadJobInfo(session, href);
        if (response
            && (response.data[0].type === 'downloads'
            || response.data[0].type === 'failed')) {
          return response;
        }
      } catch (err) {
        this.errorHandler.handleError(err);
      }
    }
  }

  /**
   * Upload object to OSS
   * @param archiveName
   * @param fileSize
   */
  async uploadZipObject(archiveName: string, fileSize: number): Promise<AxiosResponse | undefined> {
    try {
      const mimeType = this.getMimeType(archiveName);
      const readFile = util.promisify(fs.readFile);
      const tmpDir = os.tmpdir();
      const zipFilePath = path.join(tmpDir, 'cache', archiveName);
      const data = await readFile(zipFilePath);
      if (data) {
        const authToken = await this.authHelper.createInternalToken(config.get('bucket_scope'));
        if (authToken) {
          const uploadRes = await axios({
            data,
            headers: {
              'Authorization': `Bearer ${authToken.access_token}`,
              'Content-Disposition': archiveName,
              'Content-Length': fileSize,
              'Content-Type': mimeType
            },
            maxContentLength: config.get('oss_file_upload_max_size'),
            method: 'PUT',
            url: `${config.get('API_oss_host')}/buckets/${config.get('bucket_key')}/objects/${archiveName}`
          });
          if (uploadRes.status === 200) { return uploadRes.data; }
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Get Mime Type
   * @param filename
   */
  private getMimeType(filename: string): string | undefined {
    filename = filename.toLowerCase();
    const regexp = /(?:\.([^.]+))?$/; // regexp to extract file extension
    if (filename) {
      const extension = filename.match(regexp);
      const types: any = {
        dwf: 'application/vnd.autodesk.autocad.dwf',
        dwg: 'application/vnd.autodesk.autocad.dwg',
        f2d: 'application/vnd.autodesk.fusiondoc',
        f3d: 'application/vnd.autodesk.fusion360',
        fbx: 'application/octet-stream',
        iam: 'application/vnd.autodesk.inventor.assembly',
        idw: 'application/vnd.autodesk.inventor.drawing',
        ipt: 'application/vnd.autodesk.inventor.part',
        jpg: 'application/image',
        nwd: 'application/vnd.autodesk.navisworks',
        obj: 'text/plain',
        png: 'application/image',
        rvt: 'application/vnd.autodesk.revit',
        sldasm: 'application/octet-stream',
        slddrw: 'application/octet-stream',
        sldprt: 'application/octet-stream',
        step: 'text/plain',
        stp: 'text/plain',
        txt: 'application/txt',
        zip: 'application/zip'
      };
      if (extension && extension.length > 1) {
        return (types[extension[1]] !== null ? types[extension[1]] : 'application/' + extension[1]);
      }
    }
  }

  /**
   * Create a ZIP archive
   * containing parent and its reference files
   * @param parentName
   * @param fileNames
   */
  private async makeZipArchive(parentName: string, fileNames: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
      const tmpDir = os.tmpdir();
      const zipFilePath = path.join(tmpDir, 'cache', `${path.parse(parentName).name}.zip`);
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', { zlib: { level: 9} });
      output.on('close', () => {
        logger.info(`... Compressed all files [${archive.pointer()} total bytes]`);
        resolve(archive.pointer());
      });
      output.on('end', () => {
        logger.info('... data has been drained');
      });
      output.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          logger.warn(`Warning occurred while compressing the files: ${err}`);
        } else {
          reject(err);
        }
      });
      output.on('error', (err: Error) => {
        reject(err);
      });
      archive.pipe(output);
      fileNames.forEach((file: string) => {
        const filePath = path.join(tmpDir, 'cache', file);
        archive.file(filePath, { name: file });
      });
      archive.finalize();
    });
  }

  /**
   * Download Fusion document and its references from Fusion Team
   * Upload f3z archive to OSS bucket
   * @param session
   * @param objectName
   * @param payload
   */
  private async moveAndCompressFusionFiles(
    session: Context['session'],
    objectName: string,
    payload: any
  ): Promise<any> {
    try {
      const response = await this.downloadFile(session, payload.projectId, payload.versionId, 'f3z') as any;
      if (response) {
        const jobResponse = await this.pollDownloadJobInfo(session, response.links.self.href);
        if (jobResponse && jobResponse.data[0].type === 'failed') {
          throw new Error('Fusion Archive Download Failed');
        }
        if (jobResponse && jobResponse.data[0].type === 'downloads') {
          logger.info(`... Fusion Archive is downloadable from ${jobResponse.data[0].relationships.storage.meta.link.href}`);
          const file = await this.saveF3ZFile(
            session,
            objectName,
            jobResponse.data[0].relationships.storage.meta.link.href
          );
          if (file.status === 200 && file.filesize > 0) {
            let archiveName = objectName.replace('.f3d', '.zip');
            archiveName = `${path.parse(archiveName).name}.zip`;
            const uploadResponse = await this.uploadZipObject(archiveName, file.filesize);
            if (uploadResponse) { return uploadResponse; }
          }
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Download CAD assembly and its references from Fusion Team
   * Zip and compress the CAD files
   * Upload the zip file to OSS bucket
   * @param fileType
   * @param session
   * @param bucketKey
   * @param objectName
   * @param payload
   */
  private async moveAndCompressCadFiles(
    fileType: string,
    session: Context['session'],
    bucketKey: string,
    objectName: string,
    payload: any
  ): Promise<any> {
    try {
      const parentRef: IXRef = {
        extension: 'versions:autodesk.core:File',
        fileType,
        location: `urn:adsk.objects:os.object:${bucketKey}/${objectName}`,
        name: payload.name,
        type: 'versions'
      };
      payload.refs.push(parentRef);
      const downloadAll = await this.xrefHandler.downloadCADReferences(session, payload);
      if (downloadAll) {
        logger.info('... all reference files downloaded to temporary cache');
        const fileNames = this.xrefHandler.setCADReferenceFilesList(payload);
        if (fileNames && fileNames.length > 0) {
          const zipFileSize = await this.makeZipArchive(objectName, fileNames);
          if (zipFileSize > 0) {
            const archiveName = `${path.parse(objectName).name}.zip`;
            const response = await this.uploadZipObject(archiveName, zipFileSize);
            if (response) { return response; }
          }
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Move object and its references from A360/BIM360 Docs to OSS bucket
   * Step 1: download parent object and its children
   * Step 2: compress the files into a ZIP archive
   * Step 3: upload the ZIP file to OSS bucket
   * @param session
   * @param bucketKey
   * @param objectName
   * @param payload
   */
  private async moveObjectWithRefs(
    session: Context['session'],
    bucketKey: string,
    objectName: string,
    payload: any
  ): Promise<any> {
    try {
      let moveOp;
      if (payload.fileType === 'Inventor') {
        moveOp = await this.moveAndCompressCadFiles('iam', session, bucketKey, objectName, payload);
        if (moveOp) {
          logger.info('... zip file uploaded to OSS');
        }
      } else if (payload.fileType === 'Fusion') {
        moveOp = await this.moveAndCompressFusionFiles(session, objectName, payload);
        if (moveOp) {
          await this.translateFixForFusionRefs(payload);
        }
      } else if (payload.fileType === 'NavisWorks') {
        // do something
      } else if (payload.fileType === 'SolidWorks') {
        moveOp = await this.moveAndCompressCadFiles('sldasm', session, bucketKey, objectName, payload);
        if (moveOp) {
          logger.info('... zip file uploaded to OSS');
        }
      }
      return moveOp;
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Move single object from A360/BIM360 Docs to OSS bucket
   * This object has no children references
   * @param session
   * @param bucketKey
   * @param objectName
   */
  private async moveSingleObject(session: Context['session'], bucketKey: string, objectName: string): Promise<any> {
    try {
      const mimeType = this.getMimeType(objectName);
      if (!mimeType) { throw new Error('Unknown MIME type. Aborting move operation.'); }
      if (session) {
        const res = await axios({
          headers: {
            Authorization: `Bearer ${session.passport.user.access_token}`
          },
          method: 'GET',
          responseType: 'arraybuffer',
          url: `${config.get('API_oss_host')}/buckets/${bucketKey}/objects/${objectName}`
        });
        logger.info(`... successfully downloaded object ${objectName}`);
        if (res.status === 200 || res.status === 206) {
          const buffer = Buffer.from(res.data);
          const authToken = await this.authHelper.createInternalToken(config.get('bucket_scope'));
          if (authToken) {
            const uploadRes = await axios({
              data: buffer,
              headers: {
                'Authorization': `Bearer ${authToken.access_token}`,
                'Content-Length': res.headers['content-length'],
                'Content-Type': mimeType
              },
              maxContentLength: config.get('oss_file_upload_max_size'),
              method: 'PUT',
              url: `${config.get('API_oss_host')}/buckets/${config.get('bucket_key')}/objects/${objectName}`
            });
            if (uploadRes.status === 200) {
              logger.info('... file uploaded to OSS');
              return uploadRes.data;
            }
          }
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Save Fusion Archive File under temporary cache
   * On local Node.js server
   * @param session
   * @param objectName
   * @param href
   */
  private async saveF3ZFile(session: Context['session'], objectName: string, href: string): Promise<any> {
    try {
      if (session) {
        const res = await axios({
          headers: {
            Authorization: `Bearer ${session.passport.user.access_token}`
          },
          method: 'GET',
          responseType: 'arraybuffer',
          url: href
        });
        if (res.status === 200) {
          const buffer = Buffer.from(res.data);
          /**
           * BUG: https://jira.autodesk.com/browse/FDM-1219
           * download endpoints does not generate a F3Z archive
           * Instead it generates a file with F3D file extension
           * We need to rename the file from .f3d to .f3z
           */
          const tmpDir = os.tmpdir();
          if (!fs.existsSync(path.join(tmpDir, 'cache'))) { fs.mkdirSync(path.join(tmpDir, 'cache')); }
          const f3zFile = path.join(tmpDir, 'cache', `${objectName.replace('.f3d', '.zip')}`);
          const writeFile = util.promisify(fs.writeFile);
          await writeFile(f3zFile, buffer);
          logger.info(`... successfully downloaded archive locally to ${f3zFile}`);
          const stats = fs.statSync(f3zFile);
          const fileSizeInBytes = stats.size;
          if (fileSizeInBytes > 0) {
            return {
              filesize: fileSizeInBytes,
              message: res.data,
              path: f3zFile,
              status: res.status
            };
          }
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Workaround for known bug:
   * https://jira.autodesk.com/browse/ATEAM-21384
   * Forge DM endpoint allows downloading a Fusion archive,
   * but the filenames are changed, need to set rootFilename
   * to correct value.
   * The workaround consists in renaming downloaded Fusion archive
   * to zip file extension, reading from memory Manifest.json
   * to extract rootFilename value, translate zip file with updated
   * rootFilename.
   * @param payload
   */
  private async translateFixForFusionRefs(payload: any): Promise<any> {
    try {
      const archiveFile = path.basename(payload.storageLocation).replace('.f3d', '.zip');
      const tmpDir = os.tmpdir();
      const archivePath = path.join(tmpDir, 'cache', archiveFile);
      const srcDesignUrn = payload.storageLocation;
      const rootFilename = await this.getRootFileFromManifest(archivePath);
      if (rootFilename) {
        logger.info(`... retrieved new rootFilename value from Manifest.json ${rootFilename.root}`);
        await this.catalogController.updateCatalogFileRootFilename({ isFile: true, srcDesignUrn }, rootFilename.root);
        logger.info('... successfully stored new rootFilename value in catalog item');
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

}
