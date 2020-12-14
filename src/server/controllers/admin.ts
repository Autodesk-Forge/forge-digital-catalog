import config from 'config';
import fsExtra from 'fs-extra';
import log4 from 'koa-log4';
import { FilterQuery, UpdateQuery } from 'mongoose';
import os from 'os';
import path from 'path';
import { IApplicationName, ICompanyLogo, IDefaultHubProject, IFileFormatToggles, ISetting } from '../../shared/admin';
import { AuthHelper } from '../helpers/auth-handler';
import { ErrorHandler } from '../helpers/error-handler';
import { OssHandler } from '../helpers/oss-handler';
import Settings from '../models/admin';
import { Catalog } from './catalog';

const logger = log4.getLogger('admin');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

export class Admin {

  private authHelper: AuthHelper;
  private catalogController: Catalog;
  private errorHandler: ErrorHandler;
  private ossHandler: OssHandler;

  public constructor() {
    this.authHelper = new AuthHelper();
    this.catalogController = new Catalog();
    this.errorHandler = new ErrorHandler();
    this.ossHandler = new OssHandler(config.get('oauth2.clientID'), config.get('oauth2.clientSecret'), config.get('bucket_scope'));
  }

  /**
   * Clears TMP folder
   */
  public async clearCache(): Promise<void> {
    try {
      const tmpDir = os.tmpdir();
      await fsExtra.remove(path.join(tmpDir, 'cache'));
    } catch (err) {
      logger.error(err);
    }
  }

  /**
   * Removes a webAdmin
   * @param email
   */
  public async deleteWebAdmin(email: string): Promise<ISetting | undefined> {
    try {
      const setting = await Settings.findOneAndUpdate({
        name: 'webAdmins'
      },{
        $pull:  {
          webAdmins: email
        }
      }, {
        new: true
      }).exec();
      if (!!setting) { return setting; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Get Setting by Name
   * @param name
   */
  public async getSetting(name: string): Promise<ISetting[] | undefined> {
    try {
      const settings = await Settings.find({
        name
      }).exec();
      if (!!settings) { return settings; }
    } catch(err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Queries MongoDB for defaultHubProject setting
   * @param {*} name
   * @param {*} email
   */
  public async getSettingByNameAndEmail(name: string, email: string): Promise<ISetting[] | undefined> {
    try {
      const settings = await Settings.find({
        email,
        name
      }).exec();
      if (!!settings) { return settings; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Initializes database on first server run
   */
  public async initializeDb(): Promise<void> {
    try {
      await this.catalogController.setCatalogRootFolder();
      const webAdmins = await this.getSetting('webAdmins');
      if (!!webAdmins && webAdmins[0].webAdmins.length === 0) {
        logger.info('... Initializing web admins');
        await this.setSysAdmins([]);
      }
      const featureToggles = await this.getSetting('featureToggles');
      if (!!featureToggles && featureToggles.length === 0) {
        logger.info('... Initializing feature toggles');
        await this.setFeatureToggles(
          { animation: false, arvr: false, binary: false, compress: false, dedupe: false, uvs: false, svf2: false }
        );
      }
      const fileFormats = await this.getSetting('fileFormatToggles');
      if (!!fileFormats && fileFormats.length === 0) {
        logger.info('... Initializing supported file formats');
        await this.setFileFormatToggles({
          creo: false,
          dwg: false,
          fbx: false,
          fusion: false,
          inventor: false,
          navisworks: false,
          obj: false,
          solidworks: false,
          step: false
        });
      }
      const appName = await this.getSetting('applicationName');
      if (!!appName && appName.length === 0) {
        logger.info('... Initializing application name');
        await this.setApplicationName({
          name: 'applicationName',
          value: 'changeMyName'
        });
      }
      const logo = await this.getSetting('companyLogo');
      if (!!logo && logo.length === 0) {
        logger.info('... Initializing default logo');
        await this.setCompanyLogo({
          imageSrc: '',
          name: 'companyLogo'
        });
      }
      const defaultHubProject = await this.getSettingByNameAndEmail('defaultHubProject', '');
      if (!!defaultHubProject && defaultHubProject.length === 0) {
        logger.info('... initializing default hub project');
        await this.setAndUpdateDefaultHubProject({
          email: '',
          hubId: '',
          hubName: '',
          name: 'defaultHubProject',
          projectId: '',
          projectName: ''
        });
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Stores in MongoDB defaultHubProject setting
   * @param {*} body
   */
  public async setAndUpdateDefaultHubProject(body: IDefaultHubProject): Promise<ISetting|undefined> {
    try {
      const conditions: FilterQuery<ISetting> = {
        email: body.email,
        name: 'defaultHubProject'
      };
      const fields: UpdateQuery<ISetting> = body;
      const setting = await Settings.findOneAndUpdate(
        conditions,
        fields,
        {
          new: true,
          upsert: true
        }
      ).exec();
      if (!!setting) { return setting; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Set Application Name
   * @param {*} body
   */
  public async setApplicationName(body: IApplicationName): Promise<ISetting|undefined> {
    try {
      const conditions: FilterQuery<ISetting> = {
        name: 'applicationName'
      };
      const fields: UpdateQuery<ISetting> = {
        appName: body.value,
        name: 'applicationName'
      };
      const setting = await Settings.findOneAndUpdate(
        conditions,
        fields, {
        new: true,
        upsert: true
      }
      ).exec();
      if (!!setting) { return setting; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Set companyLogo
   * @param {*} body
   */
  public async setCompanyLogo(body: ICompanyLogo): Promise<ISetting|undefined> {
    try {
      const conditions: FilterQuery<ISetting> = {
        name: 'companyLogo'
      };
      const fields: UpdateQuery<ISetting> = {
        imageSrc: body.imageSrc,
        name: 'companyLogo'
      };
      const setting = await Settings.findOneAndUpdate(
        conditions,
        fields, {
        new: true,
        upsert: true
      }
      ).exec();
      if (!!setting) { return setting; }
        } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Set Features Toggles
   * @param {*} body
   */
  public async setFeatureToggles(body: {
    animation: boolean;
    arvr: boolean;
    binary: boolean;
    compress: boolean;
    dedupe: boolean;
    uvs: boolean;
    svf2: boolean;
  }): Promise<ISetting|undefined> {
    try {
      const conditions: FilterQuery<ISetting> = {
        name: 'featureToggles'
      };
      const fields: UpdateQuery<ISetting> = {
        featureToggles: {
          arvr_toolkit: body.arvr,
          fusion_animation: body.animation,
          gltf_binary_output: body.binary,
          gltf_deduplication: body.dedupe,
          gltf_draco_compression: body.compress,
          gltf_skip_unused_uvs: body.uvs,
          svf2: body.svf2
        },
        name: 'featureToggles'
      };
      const setting = await Settings.findOneAndUpdate(
        conditions,
        fields,
        {
          new: true,
          upsert: true
        }
      ).exec();
      if (!!setting) { return setting; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Set File Format Toggles
   * @param {*} body
   */
  public async setFileFormatToggles(body: IFileFormatToggles): Promise<ISetting|undefined> {
    try {
      const conditions: FilterQuery<ISetting> = {
        name: 'fileFormatToggles'
      };
      const fields: UpdateQuery<ISetting> = {
        fileFormatToggles: {
          creo: body.creo,
          dwg: body.dwg,
          fbx: body.fbx,
          fusion: body.fusion,
          inventor: body.inventor,
          navisworks: body.navisworks,
          obj: body.obj,
          solidworks: body.solidworks,
          step: body.step
        },
        name: 'fileFormatToggles'
      };
      const setting = await Settings.findOneAndUpdate(
        conditions,
        fields,
        {
          new: true,
          upsert: true
        }
      ).exec();
      if (!!setting) { return setting; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Set System Administators
   * @param {*} body
   */
  public async setSysAdmins(body: string[]): Promise<ISetting|undefined> {
    try {
      const conditions: FilterQuery<ISetting> = {
        name: 'webAdmins'
      };
      const fields: UpdateQuery<ISetting> = {
        name: 'webAdmins',
        webAdmins: body
      };
      const setting = await Settings.findOneAndUpdate(
        conditions,
        fields, {
          new: true,
          upsert: true
        }
      ).exec();
      if (!!setting) { return setting; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  public async wakeUp(): Promise<void> {
    try {
      const authToken = await this.authHelper.createInternalToken(config.get('bucket_scope'));
      if (!!authToken) {
        const accessToken = authToken.access_token;
        logger.info(`Generated 2-legged access token: ${accessToken}`);
        const bucketInfo = await this.ossHandler.getBucketInfo(authToken, config.get('bucket_key'));
        if (!!bucketInfo) {
          switch (bucketInfo.statusCode) {
            case 200:
              logger.info(`Found bucket info: ${JSON.stringify(bucketInfo.body)}`);
              break;
            case 404: {
              logger.info('... Attempting to create new bucket');
              const newBucket = await this.ossHandler.createBucket(authToken, config.get('bucket_key'));
              if (!!newBucket) { logger.info(`Created new bucket: ${JSON.stringify(newBucket.body)}`); }
              break;
            }
            default:
              logger.error('Something went wrong trying to retrieve bucket info.');
          }
        }
        await this.clearCache();
        logger.info('... Successfully cleared temporary cache');
        await this.initializeDb();
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

}
