import * as fsExtra from 'fs-extra';
import * as log4 from 'koa-log4';
import * as os from 'os';
import * as path from 'path';
import { ISetting } from '../../shared/admin';
import { ErrorHandler } from '../helpers/error-handler';
import Settings from '../models/admin';
import { Catalog } from './catalog';

const logger = log4.getLogger('admin');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

export class Admin {

  private catalogController: Catalog;
  private errorHandler: ErrorHandler;

  constructor() {
    this.catalogController = new Catalog();
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Clears TMP folder
   */
  async clearCache(): Promise<void> {
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
  async deleteWebAdmin(email: string): Promise<ISetting | undefined> {
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
      if (setting) { return setting; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Get Setting by Name
   * @param name
   */
  async getSetting(name: string): Promise<ISetting[] | undefined> {
    try {
      const settings = await Settings.find({
        name
      }).exec();
      if (settings) { return settings; }
    } catch(err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Queries MongoDB for defaultHubProject setting
   * @param {*} name
   * @param {*} email
   */
  async getSettingByNameAndEmail(name: string, email: string): Promise<ISetting[] | undefined> {
    try {
      const settings = await Settings.find({
        email,
        name
      }).exec();
      if (settings) { return settings; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Initializes database on first server run
   */
  async initializeDb(): Promise<void> {
    try {
      await this.catalogController.setCatalogRootFolder();
      const webAdmins = await this.getSetting('webAdmins');
      if (webAdmins && webAdmins[0].webAdmins.length === 0) {
        logger.info('... Initializing web admins');
        await this.setSysAdmins([]);
      }
      const featureToggles = await this.getSetting('featureToggles');
      if (featureToggles && featureToggles.length === 0) {
        logger.info('... Initializing feature toggles');
        await this.setFeatureToggles(
          { animation: false, arvr: false, binary: false, compress: false, dedupe: false, uvs: false }
        );
      }
      const fileFormats = await this.getSetting('fileFormatToggles');
      if (fileFormats && fileFormats.length === 0) {
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
      if (appName && appName.length === 0) {
        logger.info('... Initializing application name');
        await this.setApplicationName({
          name: 'applicationName',
          value: 'changeMyName'
        });
      }
      const logo = await this.getSetting('companyLogo');
      if (logo && logo.length === 0) {
        logger.info('... Initializing default logo');
        await this.setCompanyLogo({
          imageSrc: '',
          name: 'companyLogo'
        });
      }
      const defaultHubProject = await this.getSettingByNameAndEmail('defaultHubProject', '');
      if (defaultHubProject && defaultHubProject.length === 0) {
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
  async setAndUpdateDefaultHubProject(body: any): Promise<ISetting|undefined> {
    try {
      const setting = await Settings.findOneAndUpdate(
        {
          email: body.email,
          name: 'defaultHubProject'
        },
        body,
        {
          new: true,
          upsert: true
        }
      ).exec();
      if (setting) { return setting; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Set Application Name
   * @param {*} body
   */
  async setApplicationName(body: any): Promise<ISetting|undefined> {
    try {
      const setting = await Settings.findOneAndUpdate(
        {
          name: 'applicationName'
        }, {
        appName: body.value,
        name: 'applicationName'
      }, {
        new: true,
        upsert: true
      }
      ).exec();
      if (setting) { return setting; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Set companyLogo
   * @param {*} body
   */
  async setCompanyLogo(body: any): Promise<ISetting|undefined> {
    try {
      const setting = await Settings.findOneAndUpdate(
        {
          name: 'companyLogo'
        }, {
        imageSrc: body.imageSrc,
        name: 'companyLogo'
      }, {
        new: true,
        upsert: true
      }
      ).exec();
      if (setting) { return setting; }
        } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Set Features Toggles
   * @param {*} body
   */
  async setFeatureToggles(body: any): Promise<ISetting|undefined> {
    try {
      const setting = await Settings.findOneAndUpdate(
        {
          name: 'featureToggles'
        },
        {
          featureToggles: {
            arvr_toolkit: body.arvr,
            fusion_animation: body.animation,
            gltf_binary_output: body.binary,
            gltf_deduplication: body.dedupe,
            gltf_draco_compression: body.compress,
            gltf_skip_unused_uvs: body.uvs
          },
          name: 'featureToggles'
        },
        {
          new: true,
          upsert: true
        }
      ).exec();
      if (setting) { return setting; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Set File Format Toggles
   * @param {*} body
   */
  async setFileFormatToggles(body: any): Promise<ISetting|undefined> {
    try {
      const setting = await Settings.findOneAndUpdate(
        {
          name: 'fileFormatToggles'
        },
        {
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
        },
        {
          new: true,
          upsert: true
        }
      ).exec();
      if (setting) { return setting; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Set System Administators
   * @param {*} body
   */
  async setSysAdmins(body: any): Promise<ISetting|undefined> {
    try {
      const setting = await Settings.findOneAndUpdate(
        {
          name: 'webAdmins'
        }, {
          name: 'webAdmins',
          webAdmins: body
        }, {
          new: true,
          upsert: true
        }
      ).exec();
      if (setting) { return setting; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

}
