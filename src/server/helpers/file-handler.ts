import archiver from 'archiver';
import axios, { AxiosResponse } from 'axios';
import config from 'config';
import { AuthToken } from 'forge-apis';
import fs from 'fs';
import zip from 'jszip';
import { Context } from 'koa';
import log4 from 'koa-log4';
import os from 'os';
import path from 'path';
import util from 'util';
import { IPassportUser } from '../../shared/auth';
import { IXRef, IMoveJob } from '../../shared/publish';
import { Catalog } from '../controllers/catalog';
import { AuthHelper } from './auth-handler';
import { ErrorHandler } from './error-handler';
import { XrefHandler } from './xref-handler';
import { IDownloadFormats, IDownloadInfo, IDownloads, IJob, IOSSObject, ITypes } from '../../shared/data';

const apiDataHost: string = config.get('API_data_host');
const apiOssHost: string = config.get('API_oss_host');
const bucketOssKey: string = config.get('bucket_key');

const logger = log4.getLogger('file-handler');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

export class FileHandler {

  private authHelper: AuthHelper;
  private catalogController: Catalog;
  private errorHandler: ErrorHandler;
  private xrefHandler: XrefHandler;

  public constructor() {
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
  public async downloadFile(
    session: Context['session'],
    projectId: string,
    versionId: string,
    fileType: string
  ): Promise<AxiosResponse<IDownloads> | undefined> {
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
        const passport = session.passport as IPassportUser;
        const res = await axios({
          data: payload,
          headers: {
            'Authorization': `Bearer ${passport.user.access_token}`,
            'Content-Type': 'application/vnd.api+json'
          },
          method: 'POST',
          timeout: config.get('axios_long_timeout'),
          url: `${apiDataHost}/projects/${projectId}/downloads`
        });
        if (res.status === 202) {
          const result = res as AxiosResponse<IDownloads>;
          return result;
        }
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
  public async downloadFormats(
    session: Context['session'],
    projectId: string,
    versionId: string
  ): Promise<AxiosResponse<IDownloadFormats> | undefined> {
    try {
      if (session) {
        const passport = session.passport as IPassportUser;
        const res = await axios({
          headers: {
            Authorization: `Bearer ${passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: `${apiDataHost}/projects/${projectId}/versions/${encodeURIComponent(versionId)}/downloadFormats`
        });
        if (res.status === 200) {
          const formats = res as AxiosResponse<IDownloadFormats>;
          return formats; }
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
  public async getDownloadInfo(
    session: Context['session'],
    projectId: string,
    downloadId: string
  ): Promise<IDownloadInfo | undefined> {
    try {
      if (session) {
        const passport = session.passport as IPassportUser;
        const res = await axios({
          headers: {
            Authorization: `Bearer ${passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: `${apiDataHost}/projects/${projectId}/downloads/${downloadId}`
        });
        if (res.status === 200) {
          const downloadInfo = res.data as IDownloadInfo;
          return downloadInfo;
        }
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
  public async getDownloadJobInfo(session: Context['session'], href: string): Promise<IJob | undefined> {
    try {
      if (session) {
        const passport = session.passport as IPassportUser;
        const res = await axios({
          headers: {
            Authorization: `Bearer ${passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: href
        });
        const job = res.data as IJob;
        if (res.status === 200) { return job; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Read Manifest.json to retrieve rootFilename
   * @param filePath
   */
  public async getRootFileFromManifest(filePath: string): Promise<{ root: string }> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) throw err;
        zip.loadAsync(data)
          .then((archive) => {
            return archive?.file('Manifest.json')?.async('text');
          })
          .then((rootFilename) => {
            if (rootFilename) {
              logger.info(`... found rootFilename value in Manifest.json: ${rootFilename}`);
              resolve(JSON.parse(rootFilename));
            }
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
  public async getUploadStatus(
    token: AuthToken,
    objectName: string,
    sessionId: string
  ): Promise<AxiosResponse | undefined> {
    try {
      const res = await axios({
        headers: {
          Authorization: `Bearer ${token.access_token}`
        },
        method: 'GET',
        timeout: config.get('axios_timeout'),
        url: `${apiOssHost}/buckets/${bucketOssKey}/objects/${objectName}/status/${sessionId}`
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
  public async moveObject(
    session: Context['session'],
    bucketKey: string,
    objectName: string,
    payload: IMoveJob
  ): Promise<AxiosResponse<IOSSObject> | undefined> {
    try {
      let moveOp: AxiosResponse<IOSSObject> | undefined = { config: {}, data: {}, headers: {}, status: 0, statusText: '' };
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
  public async pollDownloadJobInfo(session: Context['session'], href: string): Promise<IJob | undefined> {
    while (true) {
      try {
        const job = await this.getDownloadJobInfo(session, href);
        if (!!job
            && (job.data[0].type === 'downloads'
            || job.data[0].type === 'failed')) {
              return job;
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
  public async uploadZipObject(archiveName: string, fileSize: number): Promise<IOSSObject | undefined> {
    try {
      const mimeType = this.getMimeType(archiveName);
      const readFile = util.promisify(fs.readFile);
      const tmpDir = os.tmpdir();
      const zipFilePath = path.join(tmpDir, 'cache', archiveName);
      const data = await readFile(zipFilePath);
      if (!!data) {
        const authToken = await this.authHelper.createInternalToken(config.get('bucket_scope'));
        if (!!authToken) {
          const uploadRes = await axios({
            data,
            headers: {
              'Authorization': `Bearer ${authToken.access_token}`,
              'Content-Disposition': archiveName,
              'Content-Length': fileSize,
              'Content-Type': mimeType
            },
            maxBodyLength: Infinity,
            maxContentLength: config.get('oss_file_upload_max_size'),
            method: 'PUT',
            url: `${apiOssHost}/buckets/${bucketOssKey}/objects/${archiveName}`
          });
          const result = uploadRes.data as IOSSObject;
          if (uploadRes.status === 200) { return result; }
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
    const search = /(?:\.([^.]+))?$/; // regexp to extract file extension
    if (filename) {
      const extension = search.exec(filename);
      const types: ITypes = {
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
        if (types[extension[1]] === null) {
          return 'application/' + extension[1];
        }
        return types[extension[1]];
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
      output.on('warning', (err: NodeJS.ErrnoException) => {
        if (err.code === 'ENOENT') {
          logger.warn(`Warning occurred while compressing the files: ${err.message}`);
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
      void archive.finalize();
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
    payload: IMoveJob
  ): Promise<AxiosResponse<IOSSObject> | undefined> {
    try {
      let uploadResponse: AxiosResponse<IOSSObject> = { config: {}, data: {}, headers: {}, status: 0, statusText: '' };
      const projectId = payload.projectId as string;
      const versionId = payload.versionId as string;
      const download = await this.downloadFile(session, projectId, versionId, 'f3z');
      if (download) {
        const jobInfo = await this.pollDownloadJobInfo(session, download.data.links.self.href);
        if (!!jobInfo && jobInfo.data[0].type === 'failed') {
          throw new Error('Fusion Archive Download Failed');
        }
        if (!!jobInfo && jobInfo.data[0].type === 'downloads') {
          logger.info(`... Fusion Archive is downloadable from ${jobInfo.data[0].relationships.storage.meta.link.href}`);
          const file = await this.saveF3ZFile(
            session,
            objectName,
            jobInfo.data[0].relationships.storage.meta.link.href
          );
          if (file && file.status === 200 && file.filesize > 0) {
            let archiveName = objectName.replace('.f3d', '.zip');
            archiveName = `${path.parse(archiveName).name}.zip`;
            uploadResponse = await this.uploadZipObject(archiveName, file.filesize) as AxiosResponse<IOSSObject>;
          }
        }
      }
      return uploadResponse;
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
    payload: IMoveJob
  ): Promise<AxiosResponse<IOSSObject> | undefined> {
    try {
      let response: AxiosResponse<IOSSObject> = { config: {}, data: {}, headers: {}, status: 0, statusText: '' };
      if (!payload.name) {
        throw new Error('Expecting a name value!');
      }
      const parentRef: IXRef = {
        extension: 'versions:autodesk.core:File',
        fileType,
        location: `urn:adsk.objects:os.object:${bucketKey}/${objectName}`,
        name: payload.name,
        type: 'versions'
      };
      payload.refs.push(parentRef);
      await this.xrefHandler.downloadCADReferences(session, payload);
      logger.info('... all reference files downloaded to temporary cache');
      const fileNames = this.xrefHandler.setCADReferenceFilesList(payload);
      if (fileNames && fileNames.length > 0) {
        const zipFileSize = await this.makeZipArchive(objectName, fileNames);
        if (zipFileSize > 0) {
          const archiveName = `${path.parse(objectName).name}.zip`;
          response = await this.uploadZipObject(archiveName, zipFileSize) as AxiosResponse<IOSSObject>;
        }
      }
      return response;
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
    payload: IMoveJob
  ): Promise<AxiosResponse<IOSSObject> | undefined> {
    try {
      let moveOp: AxiosResponse<IOSSObject> | undefined = { config: {}, data: {}, headers: {}, status: 0, statusText: '' };
      if (payload.fileType === 'Inventor') {
        moveOp = await this.moveAndCompressCadFiles('iam', session, bucketKey, objectName, payload);
        if (!!moveOp) {
          logger.info('... zip file uploaded to OSS');
        }
      } else if (payload.fileType === 'Fusion') {
        moveOp = await this.moveAndCompressFusionFiles(session, objectName, payload);
        if (!!moveOp) {
          await this.translateFixForFusionRefs(payload);
        }
      } else if (payload.fileType === 'NavisWorks') {
        // do something
      } else if (payload.fileType === 'SolidWorks') {
        moveOp = await this.moveAndCompressCadFiles('sldasm', session, bucketKey, objectName, payload);
        if (!!moveOp) {
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
  private async moveSingleObject(session: Context['session'], bucketKey: string, objectName: string): Promise<AxiosResponse<IOSSObject> | undefined> {
    try {
      const mimeType = this.getMimeType(objectName);
      if (!mimeType) { throw new Error('Unknown MIME type. Aborting move operation.'); }
      if (session) {
        const passport = session.passport as IPassportUser;
        const download = await axios({
          headers: {
            Authorization: `Bearer ${passport.user.access_token}`
          },
          method: 'GET',
          responseType: 'arraybuffer',
          url: `${apiOssHost}/buckets/${bucketKey}/objects/${objectName}`
        }) as AxiosResponse<Buffer>;
        logger.info(`... successfully downloaded object ${objectName}`);
        if (download.status === 200 || download.status === 206) {
          const buffer = Buffer.from(download.data);
          const authToken = await this.authHelper.createInternalToken(config.get('bucket_scope'));
          if (!!authToken) {
            const headers = download.headers as { [key: string]: string };
            const upload = await axios({
              data: buffer,
              headers: {
                'Authorization': `Bearer ${authToken.access_token}`,
                'Content-Length': headers['content-length'],
                'Content-Type': mimeType
              },
              maxBodyLength: Infinity,
              maxContentLength: config.get('oss_file_upload_max_size'),
              method: 'PUT',
              url: `${apiOssHost}/buckets/${bucketOssKey}/objects/${objectName}`
            });
            if (upload.status === 200) {
              logger.info('... file uploaded to OSS');
              const data = upload.data as AxiosResponse<IOSSObject>;
              return data;
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
  private async saveF3ZFile(session: Context['session'], objectName: string, href: string): Promise<{
    filesize: number;
    message: Buffer;
    path: string;
    status: number;
  } | undefined> {
    try {
      if (session) {
        const passport = session.passport as IPassportUser;
        const res = await axios({
          headers: {
            Authorization: `Bearer ${passport.user.access_token}`
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
              message: buffer,
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
  private async translateFixForFusionRefs(payload: IMoveJob): Promise<any> {
    try {
      if (payload.storageLocation) {
        const archiveFile = path.basename(payload.storageLocation).replace('.f3d', '.zip');
        const tmpDir = os.tmpdir();
        const archivePath = path.join(tmpDir, 'cache', archiveFile);
        const srcDesignUrn = payload.storageLocation;
        const rootFilename = await this.getRootFileFromManifest(archivePath);
        if (!!rootFilename) {
          logger.info(`... retrieved new rootFilename value from Manifest.json ${rootFilename.root}`);
          await this.catalogController.updateCatalogFileRootFilename({ isFile: true, srcDesignUrn }, rootFilename.root);
          logger.info('... successfully stored new rootFilename value in catalog item');
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

}
