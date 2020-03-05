import * as archiver from 'archiver';
import axios, { AxiosResponse } from 'axios';
import * as config from 'config';
import * as fs from 'fs';
import * as log4 from 'koa-log4';
import * as os from 'os';
import * as path from 'path';
import { AuthHelper } from '../helpers/auth-handler';
import { ErrorHandler } from '../helpers/error-handler';
import { FileHandler } from '../helpers/file-handler';
import { ForgeHandler } from '../helpers/forge-handler';
import { Admin } from './admin';
import { ArvrToolkit } from './arvr-toolkit';
import { Catalog } from './catalog';

import { IPublishJob } from '../../shared/publish';

import Publisher from '../models/publish';

const logger = log4.getLogger('publish');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

axios.defaults.withCredentials = true;

export class Publish {

  private adminController: Admin;
  private authHelper: AuthHelper;
  private arvrController: ArvrToolkit;
  private catalogController: Catalog;
  private errorHandler: ErrorHandler;
  private fileHandler: FileHandler;
  private forgeHandler: ForgeHandler;

  constructor() {
    this.adminController = new Admin();
    this.authHelper = new AuthHelper();
    this.arvrController = new ArvrToolkit();
    this.catalogController = new Catalog();
    this.errorHandler = new ErrorHandler();
    this.fileHandler = new FileHandler();
    this.forgeHandler = new ForgeHandler();
  }

  /**
   * Archives and uploads optimized Gltf files to OSS bucket
   * @param urn
   */
  async compressGltfOutput(urn: string): Promise<void> {
    try {
      const tmpDir = os.tmpdir();
      const outputFolder = path.join(tmpDir, 'cache');
      const urnFolder = path.join(outputFolder, urn.replace(/:/g, '-')); // colon is invalid character in MacOS
      const filePaths: string[] = [];
      this.listFilesInDirectory(urnFolder, (filePath: string) => {
        filePaths.push(filePath);
      });
      const catalogFile = await this.catalogController.getCatalogFileByOSSDesignUrn(urn);
      if (catalogFile && catalogFile.svfUrn) {
        await this.createArchive(catalogFile.svfUrn, filePaths, urnFolder);
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Compress the glTF output files into an archive
   * @param archiveName
   * @param fileNames
   * @param basePath
   */
  async createArchive(archiveName: string, fileNames: string[], basePath: string): Promise<number | undefined> {
    try {
      return new Promise((resolve, reject) => {
        const zipFileName = path.basename(archiveName, path.extname(archiveName));
        const tmpDir = os.tmpdir();
        const archiveFile = path.join(tmpDir, 'cache', `${zipFileName}_gltf.zip`);
        if (fs.existsSync(archiveFile)) { fs.unlinkSync(archiveFile); }
        const output = fs.createWriteStream(archiveFile);
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
            logger.warn(err);
            reject(err);
          }
        });
        output.on('error', (err) => {
          logger.error(err);
          reject(err);
        });
        archive.pipe(output);
        fileNames.forEach((filePath) => {
          if (path.dirname(filePath).endsWith('output')) {
            archive.file(filePath, { name: path.basename(filePath) });
          } else {
            const baseToOutputPath = path.relative(
              basePath,
              path.normalize(path.join(path.dirname(filePath), '../..'))
            );
            const outputPath = path.join(basePath, baseToOutputPath);
            const outputToFilePath = path.relative(outputPath, filePath);
            archive.file(filePath, { name: outputToFilePath });
          }
        });
        archive.finalize();
      });
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Runs the tasks needed post translation
   * @param resourceUrn
   */
  async finalizePublishJob(resourceUrn: string): Promise<void> {
    try {
      const buffer: Buffer = Buffer.from(resourceUrn, 'base64');
      if (buffer) {
        const asciiResourceUrn = buffer.toString('ascii');
        await this.catalogController.updateCatalogFileSvf(
          { isFile: true, ossDesignUrn: asciiResourceUrn },
          resourceUrn
        );
        await this.updatePublishLogEntry({ 'job.input.designUrn': asciiResourceUrn }, 'FINISHED', resourceUrn);
        const featureToggles = await this.adminController.getSetting('featureToggles');
        const catalogFile = await this.catalogController.getCatalogFileByOSSDesignUrn(asciiResourceUrn);
        if (
          featureToggles
          && featureToggles[0].featureToggles.arvr_toolkit
          && catalogFile
          && !catalogFile.name.toLowerCase().endsWith('.drw')
          && !catalogFile.name.toLowerCase().endsWith('.dwg')
          && !catalogFile.name.toLowerCase().endsWith('.slddrw')
          ) {
          await this.translateSvfToGltf(asciiResourceUrn);
          logger.info('... Successfully translated CAD model to SVF and glTF formats');
          await this.compressGltfOutput(asciiResourceUrn);
          logger.info('... Successfully compressed Gltf files');
          await this.uploadGltfArchiveToBucket(asciiResourceUrn);
          logger.info('... Successfully uploaded Gltf archive');
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieve Publisher Logs
   */
  async getPublishLogs(): Promise<IPublishJob[] | undefined> {
    try {
      const logs = await Publisher.find({}).exec();
      if (logs) { return logs; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieves translation job status
   * This function can be used for testing, but should not be called
   * in production as we should rely on the WebHook instead
   * @param base64Urn
   */
  async getTranslateJobStatus(base64Urn: string): Promise<AxiosResponse | undefined> {
    try {
      const authToken = await this.authHelper.createInternalToken(config.get('bucket_scope'));
      let url;
      switch (config.get('region')) {
        case 'US':
          url = `${config.get(
            'API_derivative_host'
          )}/designdata/${base64Urn}/manifest`;
          break;
        case 'EMEA':
          url = `h${config.get(
            'API_derivative_host'
          )}/regions/eu/designdata/${base64Urn}/manifest`;
          break;
        default:
          url = `h${config.get(
            'API_derivative_host'
          )}/designdata/${base64Urn}/manifest`;
      }
      if (authToken) {
        const res = await axios({
          headers: {
            Authorization: `Bearer ${authToken.access_token}`
          },
          method: 'GET',
          url
        });
        if (res.status === 200) { return res; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Sets Publish Log Entry
   * @param body
   */
  setPublishLog(body: any): IPublishJob | undefined {
    try {
      const log = new Publisher(body);
      log.save((err, logEntry) => {
        if (err) { throw new Error(err); }
        logger.info(`... successfully saved new publisher log entry`);
      });
      return log;
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Translate a CAD model to web viewable (SVF)
   * @param payload
   * @param retry
   */
  async translateJob(payload: any): Promise<AxiosResponse | undefined> {
    try {
      const region = config.get('region');
      const workflow = config.get('webhook.workflow');
      payload.misc.workflow = workflow;
      payload.output.destination.region = region;
      const authToken = await this.authHelper.createInternalToken(config.get('bucket_scope'));
      if (authToken) {
        const res = await axios({
          data: payload,
          headers: {
            'Authorization': `Bearer ${authToken.access_token}`,
            'Content-Type': 'application/json',
            'x-ads-force': true
          },
          method: 'POST',
          url: `${config.get('API_derivative_host')}/designdata/job`
        });
        if (res.status === 200 || res.status === 201) { return res; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Translate SVF bubble to glTF format
   * @param urn
   */
  async translateSvfToGltf(urn: string): Promise<void> {
    try {
      const authToken = await this.authHelper.createInternalToken(config.get('bucket_scope'));
      if (authToken) {
        const catalogFile = await this.catalogController.getCatalogFileByOSSDesignUrn(urn);
        if (catalogFile && catalogFile.svfUrn) {
          const manifest = await this.forgeHandler.getManifest(catalogFile.svfUrn, authToken.access_token);
          const guids: string[] = [];
          this.forgeHandler.traverseManifest(manifest, (node: any) => {
            if (node.mime === 'application/autodesk-svf') {
              guids.push(node.guid);
            }
          });
          const tmpDir = os.tmpdir();
          const outputFolder = path.join(tmpDir, 'cache');
          const urnFolder = path.join(outputFolder, urn.replace(/:/g, '-')); // colon ":" is invalid character on MacOS
          await Promise.all(guids.map(async (guid) => {
            if (catalogFile && catalogFile.svfUrn) {
              logger.info(`... Starting translation to glTF of viewable guid: ${guid}`);
              return await this.arvrController.convertToGltf(catalogFile.svfUrn, guid, urnFolder);
            }
          }));
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Update Publish Log Status
   * @param payload
   * @param status
   * @param svfUrn
   */
  async updatePublishLogEntry(payload: any, status: string, svfUrn: string): Promise<IPublishJob | undefined>  {
    try {
      const publishLog = await Publisher.findOneAndUpdate(
        payload, {
          $set: {
            'job.output.svfUrn': svfUrn,
            'status': status
          }
        }, {
          new: true,
          upsert: true
        }).exec();
      if (publishLog) { return publishLog; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Upload Gltf archive to OSS bucket
   * @param urn
   */
  async uploadGltfArchiveToBucket(urn: string): Promise<void> {
    try {
      const tmpDir = os.tmpdir();
      const outputFolder = path.join(tmpDir, 'cache');
      const catalogFile = await this.catalogController.getCatalogFileByOSSDesignUrn(urn);
      if (catalogFile) {
        const zipFileName = `${catalogFile.svfUrn}_gltf.zip`;
        let zipFileSize: number = 0;
        this.listFilesInDirectory(outputFolder, (filePath) => {
          if (filePath.endsWith(zipFileName)) {
            const stats = fs.statSync(filePath);
            zipFileSize = stats.size;
          }
        });
        logger.info(`... Uploading glTF archive ${zipFileName} to bucket [${zipFileSize.toString()} total bytes]`);
        const uploadZipRes = await this.fileHandler.uploadZipObject(zipFileName, zipFileSize);
        if (uploadZipRes) {
          const payload = {
            isFile: true,
            isPublished: true,
            ossDesignUrn: urn,
            svfUrn: catalogFile.svfUrn
          };
          const catalogItem = await this.catalogController.updateCatalogFileGltf(payload, uploadZipRes);
          if (catalogItem) {
            logger.info('... Updated catalog item with glTF data');
          }
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * List files recursively in a directory
   * @param dir
   * @param callback
   */
  private listFilesInDirectory(dir: string, callback: (path: string) => void): void {
    try {
      fs.readdirSync(dir).forEach((f) => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? this.listFilesInDirectory(dirPath, callback) : callback(path.join(dir, f));
      });
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

}
