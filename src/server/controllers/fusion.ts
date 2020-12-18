import axios, { AxiosResponse } from 'axios';
import config from 'config';
import { Context } from 'koa';
import log4 from 'koa-log4';
import url from 'url';
import { IPassportUser, IUser } from '../../shared/auth';
import { IFolderContents, IHubs, IItemData, IProject, IProjects, ITopFolders, IItemVersion, IItemVersions, IItemVersionRelationshipsRefs, IItemVersionMetadata } from '../../shared/data';
import { Token } from '../auth/token';
import { AuthHelper } from '../helpers/auth-handler';
import { ErrorHandler } from '../helpers/error-handler';
import { Admin } from './admin';

const apiDataHost: string = config.get('API_data_host');
const apiDerivativeHost: string = config.get('API_derivative_host');
const apiProjectHost: string = config.get('API_project_host');

const logger = log4.getLogger('fusion');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

axios.defaults.withCredentials = true;

export class Fusion {

  private adminController: Admin;
  private authHelper: AuthHelper;
  private errorHandler: ErrorHandler;

  public constructor() {
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
  public async getFolderContents(session: Context['session'], projectId: string, folderId: string): Promise<{ data: IItemData[] } | undefined> {
    try {
      const token = new Token(session);
      if (token.session) {
        const fileFormats = await this.adminController.getSetting('fileFormatToggles');
        let filters = 'folders:autodesk.core:Folder,folders:autodesk.bim360:Folder';
        if (!!fileFormats) {
          if (fileFormats[0].fileFormatToggles.fusion) {
            filters += ',items:autodesk.fusion360:Design';
          }
          if (fileFormats[0].fileFormatToggles.creo
            || fileFormats[0].fileFormatToggles.dwg
            || fileFormats[0].fileFormatToggles.fbx
            || fileFormats[0].fileFormatToggles.inventor
            || fileFormats[0].fileFormatToggles.navisworks
            || fileFormats[0].fileFormatToggles.obj
            || fileFormats[0].fileFormatToggles.revit
            || fileFormats[0].fileFormatToggles.solidworks
            || fileFormats[0].fileFormatToggles.step) {
            filters += ',items:autodesk.core:File,items:autodesk.bim360:File';
          }
        }
        const passport = token.session.passport as IPassportUser;
        const res = await axios({
          headers: {
            Authorization: `Bearer ${passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: `${apiDataHost}/projects/${projectId}/folders/${folderId}/contents?filter[extension.type]=${filters}`
        });
        if (res.status === 200) {
          const contents = res.data as IFolderContents;
          const items: { data: IItemData[] } = { data: [] };
          const folderDocs = contents.data.filter((item: IItemData) => {
            return item.type === 'folders';
          });
          items.data.push(...folderDocs);
          if (fileFormats && fileFormats[0].fileFormatToggles.creo) {
            const creoDocs = contents.data.filter((item: IItemData) => {
              return item.type === 'items'
                && (item.attributes.displayName.toLowerCase().endsWith('.asm')
                || item.attributes.displayName.toLowerCase().endsWith('.drw')
                || item.attributes.displayName.toLowerCase().endsWith('.prt'));
            });
            items.data.push(...creoDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.dwg) {
            const dwgDocs = contents.data.filter((item: IItemData) => {
              return item.type === 'items'
                && item.attributes.displayName.toLowerCase().endsWith('.dwg');
            });
            items.data.push(...dwgDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.fbx) {
            const fbxDocs = contents.data.filter((item: IItemData) => {
              return item.type === 'items'
                && item.attributes.displayName.toLowerCase().endsWith('.fbx');
            });
            items.data.push(...fbxDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.fusion) {
            const fusionDocs = contents.data.filter((item: IItemData) => {
              return item.attributes.extension.type === 'items:autodesk.fusion360:Design';
            });
            items.data.push(...fusionDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.inventor) {
            const inventorDocs = contents.data.filter((item: IItemData) => {
              return item.type === 'items'
                && (item.attributes.displayName.toLowerCase().endsWith('.iam')
                || item.attributes.displayName.toLowerCase().endsWith('.idw')
                || item.attributes.displayName.toLowerCase().endsWith('.ipt'));
            });
            items.data.push(...inventorDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.navisworks) {
            const navisworksDocs = contents.data.filter((item: IItemData) => {
              return item.type === 'items'
                && item.attributes.displayName.toLowerCase().endsWith('.nwd');
            });
            items.data.push(...navisworksDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.obj) {
            const objDocs = contents.data.filter((item: IItemData) => {
              return item.type === 'items'
                && item.attributes.displayName.toLowerCase().endsWith('.obj');
            });
            items.data.push(...objDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.revit) {
            const revitDocs = contents.data.filter((item: IItemData) => {
              return item.type === 'items'
                && item.attributes.displayName.toLowerCase().endsWith('.rvt');
            });
            items.data.push(...revitDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.solidworks) {
            const solidworksDocs = contents.data.filter((item: IItemData) => {
              return item.type === 'items'
                && (item.attributes.displayName.toLowerCase().endsWith('.sldasm')
                || item.attributes.displayName.toLowerCase().endsWith('.slddrw')
                || item.attributes.displayName.toLowerCase().endsWith('.sldprt'));
            });
            items.data.push(...solidworksDocs);
          }
          if (fileFormats && fileFormats[0].fileFormatToggles.step) {
            const stepDocs = contents.data.filter((item: IItemData) => {
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
  public async getHubs(session: Context['session']): Promise<AxiosResponse<IHubs> | undefined> {
    try {
      const token = new Token(session);
      if (token.session) {
        if (!token.session.passport) {
          logger.error('... Found empty passport session');
          throw new Error('Found empty passport session');
        }
        // Limit to A360 Teams hubs & BIM360 Docs only (no personal hubs allowed)
        const passport = token.session.passport as IPassportUser;
        const res = await axios({
          headers: {
            Authorization: `Bearer ${passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: `${apiProjectHost}/hubs?filter[extension.type]=hubs:autodesk.core:Hub&filter[extension.type]=hubs:autodesk.bim360:Account`
        });
        if (res.status === 200) {
          const hubs = res as AxiosResponse<IHubs>;
          return hubs;
        }
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
  public async getItemVersionInfo(session: Context['session'], projectId: string, versionId: string): Promise<IItemVersionMetadata | undefined> {
    try {
      const token = new Token(session);
      if (token.session) {
        const passport = token.session.passport as IPassportUser;
        const res = await axios({
          headers: {
            Authorization: `Bearer ${passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: `${apiDataHost}/projects/${projectId}/versions/${encodeURIComponent(versionId)}`
        });
        if (res.status === 200) {
          const versionInfo = res.data as IItemVersion;
          const fileType: string = (versionInfo.data.attributes.fileType)
            ? versionInfo.data.attributes.fileType
            : versionInfo.data.attributes.extension.type;
          const metadata = {
            derivativeUrn: versionInfo.data.relationships.derivatives.data.id,
            designUrn: versionInfo.data.id,
            fileType,
            name: versionInfo.data.attributes.displayName,
            size: versionInfo.data.attributes.storageSize,
            storageLocation: versionInfo.data.relationships.storage.data.id
          } as IItemVersionMetadata;
          return metadata;
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
  public async getItemVersions(
    session: Context['session'],
    projectId: string,
    itemId: string
  ): Promise<AxiosResponse<IItemVersions> | undefined> {
    try {
      const token = new Token(session);
      if (token.session) {
        const passport = token.session.passport as IPassportUser;
        const res = await axios({
          headers: {
            Authorization: `Bearer ${passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: `${apiDataHost}/projects/${projectId}/items/${itemId}/versions`
        });
        if (res.status === 200) {
          const versions = res as AxiosResponse<IItemVersions>;
          return versions;
        }
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
  public async getProject(
    session: Context['session'],
    hubId: string,
    projectId: string
  ): Promise<AxiosResponse<IProject> | undefined> {
    try {
      const token = new Token(session);
      if (token.session) {
        const passport = token.session.passport as IPassportUser;
        const res = await axios({
          headers: {
            Authorization: `Bearer ${passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: `${apiProjectHost}/hubs/${hubId}/projects/${projectId}`
        });
        if (res.status === 200) {
          const project = res as AxiosResponse<IProject>;
          return project;
        }
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
  public async getProjects(session: Context['session'], hubId: string): Promise<AxiosResponse<IProjects> | undefined> {
    try {
      const token = new Token(session);
      if (token.session) {
        const passport = token.session.passport as IPassportUser;
        const res = await axios({
          headers: {
            Authorization: `Bearer ${passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_long_timeout'),
          url: `${apiProjectHost}/hubs/${hubId}/projects`
        });
        if (res.status === 200) {
          const projects = res as AxiosResponse<IProjects>;
          return projects;
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Returns thumbnail data URI
   * @param urn
   */
  public async getThumbnail(urn: string): Promise<string | undefined> {
    try {
      const authToken = await this.authHelper.createInternalToken(config.get('view_scope'));
      if (!!authToken) {
        const res = await axios({
          headers: {
            Authorization: `Bearer ${authToken.access_token}`
          },
          method: 'GET',
          responseType: 'arraybuffer',
          url: `${apiDerivativeHost}/designdata/${urn}/thumbnail?width=100&height=100`
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
  public async getTopFolders(
    session: Context['session'],
    hubId: string, projectId: string): Promise<AxiosResponse<ITopFolders> | undefined> {
    try {
      const token = new Token(session);
      if (token.session) {
        const passport = token.session.passport as IPassportUser;
        const res = await axios({
          headers: {
            Authorization: `Bearer ${passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: `${apiProjectHost}/hubs/${hubId}/projects/${projectId}/topFolders`
        });
        if (res.status === 200) {
          const folders = res as AxiosResponse<ITopFolders>;
          return folders;
        }
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
  public async getUserProfile(session: Context['session']): Promise<AxiosResponse<IUser> | undefined> {
    try {
      const token = new Token(session);
      if (token.session) {
        if (!token.session.passport) {
          logger.error('... Found empty passport session');
          throw new Error('Found empty passport session');
        }
        const passport = token.session.passport as IPassportUser;
        const res = await axios({
          headers: {
            Authorization: `Bearer ${passport.user.access_token}`
          },
          method: 'GET',
          timeout: config.get('axios_timeout'),
          url: url.resolve(apiDataHost, url.resolve(config.get('userprofile_path'), 'users/@me'))
        });
        if (res.status === 200) {
          const profile = res as AxiosResponse<IUser>;
          return profile;
        }
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
  public async getVersionRefs(
    session: Context['session'],
    projectId: string,
    versionId: string
  ): Promise<AxiosResponse<IItemVersionRelationshipsRefs> | undefined> {
    try {
      const token = new Token(session);
      if (token.session) {
        const passport = token.session.passport as IPassportUser;
        const res = await axios({
          headers: {
            Authorization: `Bearer ${passport.user.access_token}`
          },
          method: 'GET',
          url: `${apiDataHost}/projects/${projectId}/versions/${encodeURIComponent(versionId)}/relationships/refs?filter[type]=versions&filter[direction]=from`
        });
        if (res.status === 200) {
          const refs = res as AxiosResponse<IItemVersionRelationshipsRefs>;
          return refs; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

}
