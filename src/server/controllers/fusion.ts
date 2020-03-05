import axios, { AxiosResponse } from 'axios';
import * as config from 'config';
import { Context } from 'koa';
import * as log4 from 'koa-log4';
import * as url from 'url';
import { Token } from '../auth/token';
import { AuthHelper } from '../helpers/auth-handler';
import { ErrorHandler } from '../helpers/error-handler';
import { Admin } from './admin';

const logger = log4.getLogger('fusion');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

axios.defaults.withCredentials = true;

export class Fusion {

  private adminController: Admin;
  private authHelper: AuthHelper;
  private errorHandler: ErrorHandler;

  constructor() {
    this.adminController = new Admin();
    this.authHelper = new AuthHelper();
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Retrieve folder content
   * @param session
   * @param projectId
   * @param folderId
   */
  async getFolderContents(session: Context['session'], projectId: string, folderId: string): Promise<any> {
    try {
      const token = new Token(session);
      if (token.session) {
        const fileFormats = await this.adminController.getSetting('fileFormatToggles');
        let filters = 'folders:autodesk.core:Folder,folders:autodesk.bim360:Folder';
        if (fileFormats) {
          if (fileFormats[0].fileFormatToggles.fusion) {
            filters += ',items:autodesk.fusion360:Design';
          }
          if (fileFormats[0].fileFormatToggles.creo
            || fileFormats[0].fileFormatToggles.dwg
            || fileFormats[0].fileFormatToggles.fbx
            || fileFormats[0].fileFormatToggles.inventor
            || fileFormats[0].fileFormatToggles.navisworks
            || fileFormats[0].fileFormatToggles.obj
            || fileFormats[0].fileFormatToggles.solidworks
            || fileFormats[0].fileFormatToggles.step) {
            filters += ',items:autodesk.core:File,items:autodesk.bim360:File';
          }
        }
        const res = await axios({
          headers: {
            Authorization: `Bearer ${token.session.passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: `${config.get('API_data_host')}/projects/${projectId}/folders/${folderId}/contents?filter[extension.type]=${filters}`
        });
        if (res.status === 200) {
          const items: any = {};
          items.data = [];
          const folderDocs = res.data.data.filter((item: any) => {
            return item.type === 'folders';
          });
          items.data.push(...folderDocs);
          if (fileFormats && fileFormats[0].fileFormatToggles.creo) {
            const creoDocs = res.data.data.filter((item: any) => {
              return item.type === 'items'
                && (item.attributes.displayName.toLowerCase().endsWith('.asm')
                || item.attributes.displayName.toLowerCase().endsWith('.drw')
                || item.attributes.displayName.toLowerCase().endsWith('.prt'));
            });
            items.data.push(...creoDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.dwg) {
            const dwgDocs = res.data.data.filter((item: any) => {
              return item.type === 'items'
                && item.attributes.displayName.toLowerCase().endsWith('.dwg');
            });
            items.data.push(...dwgDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.fbx) {
            const fbxDocs = res.data.data.filter((item: any) => {
              return item.type === 'items'
                && item.attributes.displayName.toLowerCase().endsWith('.fbx');
            });
            items.data.push(...fbxDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.fusion) {
            const fusionDocs = res.data.data.filter((item: any) => {
              return item.attributes.extension.type === 'items:autodesk.fusion360:Design';
            });
            items.data.push(...fusionDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.inventor) {
            const inventorDocs = res.data.data.filter((item: any) => {
              return item.type === 'items'
                && (item.attributes.displayName.toLowerCase().endsWith('.iam')
                || item.attributes.displayName.toLowerCase().endsWith('.idw')
                || item.attributes.displayName.toLowerCase().endsWith('.ipt'));
            });
            items.data.push(...inventorDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.navisworks) {
            const navisworksDocs = res.data.data.filter((item: any) => {
              return item.type === 'items'
                && item.attributes.displayName.toLowerCase().endsWith('.nwd');
            });
            items.data.push(...navisworksDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.obj) {
            const objDocs = res.data.data.filter((item: any) => {
              return item.type === 'items'
                && item.attributes.displayName.toLowerCase().endsWith('.obj');
            });
            items.data.push(...objDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.solidworks) {
            const solidworksDocs = res.data.data.filter((item: any) => {
              return item.type === 'items'
                && (item.attributes.displayName.toLowerCase().endsWith('.sldasm')
                || item.attributes.displayName.toLowerCase().endsWith('.slddrw')
                || item.attributes.displayName.toLowerCase().endsWith('.sldprt'));
            });
            items.data.push(...solidworksDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.step) {
            const stepDocs = res.data.data.filter((item: any) => {
              return item.type === 'items'
                && (item.attributes.displayName.toLowerCase().endsWith('.step')
                || item.attributes.displayName.toLowerCase().endsWith('.stp'));
            });
            items.data.push(...stepDocs);
          }
          return items;
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieves Hubs
   * @param session
   */
  async getHubs(session: Context['session']): Promise<AxiosResponse | undefined> {
    try {
      const token = new Token(session);
      if (token.session) {
        if (!token.session.passport) {
          logger.error('... Found empty passport session');
          throw new Error('Found empty passport session');
        }
        // Limit to A360 Teams hubs & BIM360 Docs only (no personal hubs allowed)
        const res = await axios({
          headers: {
            Authorization: `Bearer ${token.session.passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: `${config.get('API_project_host')}/hubs?filter[extension.type]=hubs:autodesk.core:Hub&filter[extension.type]=hubs:autodesk.bim360:Account`
        });
        if (res.status === 200) { return res; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieve Information about the Item Version
   * @param session
   * @param projectId
   * @param versionId
   */
  async getItemVersionInfo(session: Context['session'], projectId: string, versionId: string): Promise<any> {
    try {
      const token = new Token(session);
      if (token.session) {
        const res = await axios({
          headers: {
            Authorization: `Bearer ${token.session.passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: `${config.get('API_data_host')}/projects/${projectId}/versions/${encodeURIComponent(versionId)}`
        });
        if (res.status === 200) {
          const fileType: string = (res.data.data.attributes.fileType)
            ? res.data.data.attributes.fileType
            : res.data.data.attributes.extension.type;
          return {
            message: {
              derivativeUrn: res.data.data.relationships.derivatives.data.id,
              designUrn: res.data.data.id,
              fileType,
              name: res.data.data.attributes.displayName,
              size: res.data.data.attributes.storageSize,
              storageLocation: res.data.data.relationships.storage.data.id
            },
            status: 200
          };
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieves item's versions
   * @param session
   * @param projectId
   * @param itemId
   */
  async getItemVersions(
    session: Context['session'],
    projectId: string,
    itemId: string
  ): Promise<AxiosResponse | undefined> {
    try {
      const token = new Token(session);
      if (token.session) {
        const res = await axios({
          headers: {
            Authorization: `Bearer ${token.session.passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: `${config.get('API_data_host')}/projects/${projectId}/items/${itemId}/versions`
        });
        if (res.status === 200) { return res; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Get Project Information
   * @param session
   * @param hubId
   * @param projectId
   */
  async getProject(
    session: Context['session'],
    hubId: string,
    projectId: string
  ): Promise<AxiosResponse | undefined> {
    try {
      const token = new Token(session);
      if (token.session) {
        const res = await axios({
          headers: {
            Authorization: `Bearer ${token.session.passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: `${config.get('API_project_host')}/hubs/${hubId}/projects/${projectId}`
        });
        if (res.status === 200) { return res; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieves Projects for a specific Hub
   * @param session
   * @param hubId
   */
  async getProjects(session: Context['session'], hubId: string): Promise<AxiosResponse | undefined> {
    try {
      const token = new Token(session);
      if (token.session) {
        const res = await axios({
          headers: {
            Authorization: `Bearer ${token.session.passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_long_timeout'),
          url: `${config.get('API_project_host')}/hubs/${hubId}/projects`
        });
        if (res.status === 200) { return res; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Returns thumbnail data URI
   * @param urn
   */
  async getThumbnail(urn: string): Promise<string | undefined> {
    try {
      const authToken = await this.authHelper.createInternalToken(config.get('view_scope'));
      if (authToken) {
        const res = await axios({
          headers: {
            Authorization: `Bearer ${authToken.access_token}`
          },
          method: 'GET',
          responseType: 'arraybuffer',
          url: `${config.get('API_derivative_host')}/designdata/${urn}/thumbnail?width=100&height=100`
        });
        if (res.status === 200) {
          const b64Encoded = Buffer.from(res.data, 'binary').toString('base64');
          const dataUri = `data:image/png;base64,${b64Encoded}`;
          return dataUri;
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Returns the details of the highest level folders the user has access to for a given project
   * @param session
   * @param hubId
   * @param projectId
   */
  async getTopFolders(
    session: Context['session'],
    hubId: string, projectId: string): Promise<AxiosResponse | undefined> {
    try {
      const token = new Token(session);
      if (token.session) {
        const res = await axios({
          headers: {
            Authorization: `Bearer ${token.session.passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: `${config.get('API_project_host')}/hubs/${hubId}/projects/${projectId}/topFolders`
        });
        if (res.status === 200) { return res; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieves user profile
   * @param session
   * @param retry
   */
  async getUserProfile(session: Context['session']): Promise<AxiosResponse | undefined> {
    try {
      const token = new Token(session);
      if (token.session) {
        if (!token.session.passport) {
          logger.error('... Found empty passport session');
          throw new Error('Found empty passport session');
        }
        const res = await axios({
          headers: {
            Authorization: `Bearer ${token.session.passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: url.resolve(config.get('API_data_host'), url.resolve(config.get('userprofile_path'), 'users/@me'))
        });
        if (res.status === 200) { return res; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieve Version Refs
   * We only want children i.e. direction=from
   * @param session
   * @param projectId
   * @param versionId
   */
  async getVersionRefs(
    session: Context['session'],
    projectId: string,
    versionId: string
  ): Promise<AxiosResponse | undefined> {
    try {
      const token = new Token(session);
      if (token.session) {
        const res = await axios({
          headers: {
            Authorization: `Bearer ${token.session.passport.user.access_token}`
          },
          method: 'GET',
          url: `${config.get('API_data_host')}/projects/${projectId}/versions/${encodeURIComponent(versionId)}/relationships/refs?filter[type]=versions&filter[direction]=from`
        });
        if (res.status === 200) { return res; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

}
