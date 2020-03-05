import { AxiosResponse } from 'axios';
import * as config from 'config';
import { ApiResponse, AuthClientTwoLegged, AuthToken, BucketsApi, ObjectsApi, Scope } from 'forge-apis';
import * as fs from 'fs';
import * as log4 from 'koa-log4';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';
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

  constructor(clientId: string, clientSecret: string, scope: Scope[]) {
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
  async createBucket(credentials: AuthToken, bucketKey: string): Promise<ApiResponse | undefined> {
    try {
      const bucketsApi = new BucketsApi();
      const buckets = await bucketsApi.createBucket({
        bucketKey,
        policyKey: 'persistent'
      }, {
        xAdsRegion: config.get('region')
      }, this.oAuth2Client, credentials);
      if (buckets) { return buckets; }
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
  async downloadObject(
    bucketKey: string,
    objectName: string,
    sourceFileName: string,
    session?: Context['session']
  ): Promise<AxiosResponse | undefined> {
    try {
      if (session && session.passport.user.access_token) {
        const credentials = {
          access_token: session.passport.user.access_token,
          expires_in: 3600,
          refresh_token: session.passport.user.refresh_token,
          token_type: 'Bearer'
        };
        const objectsApi = new ObjectsApi();
        const download = await objectsApi.getObject(bucketKey, objectName, {}, this.oAuth2Client, credentials);
        if (download) {
          const buffer = Buffer.from(download.body);
          const tmpDir = os.tmpdir();
          const outputDir = path.join(tmpDir, 'cache');
          if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir); }
          const outputFile = `${outputDir}/${sourceFileName}`;
          const writeFile = util.promisify(fs.writeFile);
          await writeFile(outputFile, buffer);
          logger.info(`... successfully downloaded CAD object to local file ${outputFile}`);
          const response: AxiosResponse = {
            config: {},
            data: buffer,
            headers: {},
            status: 200,
            statusText: 'OK'
          };
          return response;
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
  async downloadGltfObject(
    bucketKey: string,
    objectName: string,
    sourceFileName: string
  ): Promise<AxiosResponse | undefined> {
    try {
      const credentials = await this.authHelper.createInternalToken(config.get('bucket_scope'));
      const objectsApi = new ObjectsApi();
      if (credentials) {
        const download = await objectsApi.getObject(bucketKey, objectName, {}, this.oAuth2Client, credentials);
        if (download) {
          const buffer = Buffer.from(download.body);
          const tmpDir = os.tmpdir();
          const outputDir = path.join(tmpDir, 'cache');
          if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir); }
          const outputFile = `${outputDir}/${sourceFileName}`;
          const writeFile = util.promisify(fs.writeFile);
          await writeFile(outputFile, buffer);
          const response: AxiosResponse = {
            config: {},
            data: buffer,
            headers: {},
            status: 200,
            statusText: 'OK'
          };
          return response;
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
  async getBucketInfo(credentials: AuthToken, bucketKey: string): Promise<ApiResponse | undefined> {
    try {
      const bucketsApi = new BucketsApi();
      const bucketDetails = bucketsApi.getBucketDetails(bucketKey, this.oAuth2Client, credentials);
      if (bucketDetails) { return bucketDetails; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

}
