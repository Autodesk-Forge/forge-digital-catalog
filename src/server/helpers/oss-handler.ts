import config from 'config';
import { ApiResponse, AuthClientTwoLegged, AuthToken, BucketsApi, ObjectsApi, Scope } from 'forge-apis';
import fs from 'fs';
import log4 from 'koa-log4';
import os from 'os';
import path from 'path';
import util from 'util';
import { IPassportUser } from '../../shared/auth';
import { IDownloadObject } from '../../shared/data';
import { ErrorHandler } from './error-handler';
import { AuthHelper } from '../helpers/auth-handler';
import { Context } from 'koa';

const logger = log4.getLogger('oss-handler');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

export class OssHandler {

  private authHelper: AuthHelper;
  private clientId: string;
  private clientSecret: string;
  private errorHandler: ErrorHandler;
  private oAuth2Client: AuthClientTwoLegged;
  private scope: Scope[];

  public constructor(clientId: string, clientSecret: string, scope: Scope[]) {
    this.authHelper = new AuthHelper();
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.errorHandler = new ErrorHandler();
    this.scope = scope;
    this.oAuth2Client = new AuthClientTwoLegged(this.clientId, this.clientSecret, this.scope, true);
  }

  /**
   * Creates an OSS bucket
   * @param credentials
   * @param bucketKey
   */
  public async createBucket(credentials: AuthToken, bucketKey: string): Promise<ApiResponse | undefined> {
    try {
      const bucketsApi = new BucketsApi();
      const buckets = await bucketsApi.createBucket({
        bucketKey,
        policyKey: 'persistent'
      }, {
        xAdsRegion: config.get('region')
      }, this.oAuth2Client, credentials);
      if (!!buckets) { return buckets; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Download an object
   * @param credentials
   * @param bucketKey
   * @param objectName
   * @param sourceFileName
   */
  public async downloadObject(
    bucketKey: string,
    objectName: string,
    sourceFileName: string,
    session?: Context['session']
  ): Promise<IDownloadObject | undefined> {
    try {
      if (session) {
        const passport = session.passport as IPassportUser;
        const credentials = {
          access_token: passport.user.access_token,
          expires_in: 3600,
          refresh_token: passport.user.refresh_token,
          token_type: 'Bearer'
        };
        const objectsApi = new ObjectsApi();
        const download = await objectsApi.getObject(bucketKey, objectName, {}, this.oAuth2Client, credentials);
        if (!!download) {
          const buffer = Buffer.from(download.body);
          const tmpDir = os.tmpdir();
          const outputDir = path.join(tmpDir, 'cache');
          if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir); }
          const outputFile = `${outputDir}/${sourceFileName}`;
          const writeFile = util.promisify(fs.writeFile);
          await writeFile(outputFile, buffer);
          logger.info(`... successfully downloaded CAD object to local file ${outputFile}`);
          const object: IDownloadObject = {
            config: {},
            data: buffer,
            headers: {},
            status: 200,
            statusText: 'OK'
          };
          return object;
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Download Gltf files
   * @param bucketKey
   * @param objectName
   * @param sourceFileName
   */
  public async downloadGltfObject(
    bucketKey: string,
    objectName: string,
    sourceFileName: string
  ): Promise<IDownloadObject | undefined> {
    try {
      const credentials = await this.authHelper.createInternalToken(config.get('bucket_scope'));
      const objectsApi = new ObjectsApi();
      if (credentials) {
        const download = await objectsApi.getObject(bucketKey, objectName, {}, this.oAuth2Client, credentials);
        if (!!download) {
          const buffer = Buffer.from(download.body);
          const tmpDir = os.tmpdir();
          const outputDir = path.join(tmpDir, 'cache');
          if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir); }
          const outputFile = `${outputDir}/${sourceFileName}`;
          const writeFile = util.promisify(fs.writeFile);
          await writeFile(outputFile, buffer);
          const object: IDownloadObject = {
            config: {},
            data: buffer,
            headers: {},
            status: 200,
            statusText: 'OK'
          };
          return object;
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieves OSS bucket info
   * @param credentials
   * @param bucketKey
   */
  public async getBucketInfo(credentials: AuthToken, bucketKey: string): Promise<ApiResponse | undefined> {
    try {
      const bucketsApi = new BucketsApi();
      const bucketDetails = await bucketsApi.getBucketDetails(bucketKey, this.oAuth2Client, credentials);
      if (!!bucketDetails) { return bucketDetails; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

}
