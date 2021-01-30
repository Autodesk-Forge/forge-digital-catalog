import log4 from 'koa-log4';
import { FilterQuery, UpdateQuery } from 'mongoose';
import { ICatalog, IGltf } from '../../shared/catalog';
import { ErrorHandler } from '../helpers/error-handler';
import CatalogDb from '../models/catalog';

const logger = log4.getLogger('catalog');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

export class Catalog {

  private errorHandler: ErrorHandler;

  public constructor() {
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Deletes a catalog item
   * @param body
   */
  public async deleteCatalogFile(catalog: ICatalog): Promise<ICatalog | undefined> {
    try {
      const filter: FilterQuery<ICatalog> = {
        isFile: true,
        name: catalog.name,
        path: catalog.path
      };
      const query = await CatalogDb.deleteOne(filter).exec() as { ok: number; deletedCount: number };
      if (query.ok === 1 && query.deletedCount === 1) {
        return catalog;
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Deletes a catalog folder
   * @param body
   */
  public async deleteCatalogFolder(catalog: ICatalog): Promise<ICatalog | undefined> {
    try {
      const filter: FilterQuery<ICatalog> = {
        isFile: false,
        name: catalog.name,
        path: catalog.path
      };
      const query = await CatalogDb.deleteOne(filter).exec() as { ok: number; deletedCount: number };
      if (query.ok === 1 && query.deletedCount === 1) {
        return catalog;
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Deletes a catalog folder and its content
   * @param body
   */
  public async deleteCatalogFolderWithContent(catalog: ICatalog): Promise<ICatalog | undefined> {
    try {
      const deleteString = this.escapeRegExp (`${catalog.path}${catalog.name},`);
      const filter: FilterQuery<ICatalog> = { path: { $regex: deleteString } };
      const deleteQuery = await CatalogDb.deleteMany(filter).exec() as { ok: number; deletedCount: number };
      if (deleteQuery.ok === 1) {
        const filter2: FilterQuery<ICatalog> = {
          isFile: false,
          name: catalog.name,
          path: catalog.path
        };
        const query = await CatalogDb.deleteOne(filter2).exec() as { ok: number; deletedCount: number };
        if (query.ok === 1 && query.deletedCount === 1) {
          return catalog;
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieves catalog item by id
   * @param id
   */
  public async getCatalogFileById(id: string): Promise<ICatalog | undefined> {
    try {
      const catalogFile = await CatalogDb.findById(id).exec();
      if (!!catalogFile) { return catalogFile; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieves catalog item by name
   * @param name
   */
  public async getCatalogFileByName(name: string): Promise<ICatalog | undefined> {
    try {
      const catalogFile = await CatalogDb.findOne({
        isFile: true,
        name
      }).exec();
      if (!!catalogFile) { return catalogFile; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieves catalog item by its OSS design urn
   * @param urn
   */
  public async getCatalogFileByOSSDesignUrn(urn: string): Promise<ICatalog | undefined> {
    try {
      const catalogFile = await CatalogDb.findOne({
        isFile: true,
        ossDesignUrn: urn
      }).exec();
      if (!!catalogFile) { return catalogFile; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieves catalog item by its source design urn
   * @param body
   */
  public async getCatalogFileBySrcDesignUrn(urn: string): Promise<ICatalog | undefined> {
    try {
      const catalogFile = await CatalogDb.findOne({
        isFile: true,
        srcDesignUrn: urn
      }).exec();
      if (!!catalogFile) { return catalogFile; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieves catalog item by path and name
   * @param name
   * @param path
   */
  public async getCatalogFile(name: string, path: string): Promise<ICatalog | undefined> {
    try {
      const catalogFile = await CatalogDb.findOne({
        isFile: true,
        name,
        path
      }).exec();
      if (!!catalogFile) { return catalogFile; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieves catalog folder by id
   * @param id
   */
  public async getCatalogFolderById(id: string): Promise<ICatalog | undefined> {
    try {
      const catalogFolder = await CatalogDb.findById(id).exec();
      if (!!catalogFolder) { return catalogFolder; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieves catalog root folder
   */
  public async getCatalogRootFolder(): Promise<ICatalog | undefined> {
    try {
      const rootFolder = await CatalogDb.findOne({
        isFile: false,
        name: 'Root Folder',
        path: ''
      }).exec();
      if (!!rootFolder) { return rootFolder; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieves catalog children
   * @param folder
   */
  public async getCatalogChildren(folder: string): Promise<ICatalog[] | undefined> {
    try {
      const searchString = this.escapeRegExp (`,${folder},$`);
      const catalogChildren = await CatalogDb.find(
        {
          path: { $regex: searchString }
        },
        ['name', 'path', 'isFile', 'isPublished']
      )
        .sort({ name: 1, path: 1 })
        .exec();
      if (!!catalogChildren) { return catalogChildren; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Renames a catalog folder
   * @param body
   */
  public async renameCatalogFolder(catalog: ICatalog): Promise<{
    new: string;
    old: string;
  } | undefined> {
    try {
      const conditions: FilterQuery<ICatalog> = {
        isFile: false,
        name: catalog.name,
        path: catalog.path
      };
      const fields: UpdateQuery<ICatalog> = {
        name: catalog.newName
      };
      const catalogFolder = await CatalogDb.findOneAndUpdate(
        conditions,
        fields,
        {
          upsert: true
        }
      ).exec();
      if (!!catalogFolder && catalog.newName) {
        const oldNameWithCommas = this.escapeRegExp(`,${catalog.name},`);
        const newNameWithCommas = this.escapeRegExp(`,${catalog.newName},`);
        const filter: FilterQuery<ICatalog> = { path: { $regex: oldNameWithCommas } };
        for await (const doc of await CatalogDb.find(filter).exec()) {
          doc.path = doc.path.replace(oldNameWithCommas, newNameWithCommas);
          void doc.save();
        }
        logger.info(`Successfully renamed catalog folder: ${catalog.path}${catalog.name} to ${catalog.path}${catalog.newName}`);
        return {
          new: `${catalog.path}${catalog.newName}`,
          old: `${catalog.path}${catalog.name}`
        };
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Creates new catalog item
   * @param body
   */
  public async setCatalogFile(catalog: ICatalog): Promise<ICatalog | undefined>  {
    try {
      const filter = catalog as unknown as FilterQuery<ICatalog> ;
      const duplicateFile = await CatalogDb.find(filter).exec();
      if (!!duplicateFile && duplicateFile.length > 0) { throw new Error('Duplicate catalog file found.'); }
      const conditions: FilterQuery<ICatalog> = {
        isFile: true,
        name: catalog.name,
        path: catalog.path,
        rootFilename: '',
        size: catalog.size,
        srcDesignUrn: catalog.srcDesignUrn
      };
      const fields: UpdateQuery<ICatalog> = catalog;
      const catalogFile = await CatalogDb.findOneAndUpdate(
        conditions,
        fields,
        {
          new: true,
          upsert: true
        }
      ).exec();
      if (catalogFile) { return catalogFile; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Creates new catalog folder
   * @param body
   */
  public async setCatalogFolder(catalog: ICatalog): Promise<ICatalog | void> {
    try {
      const filter = catalog as unknown as FilterQuery<ICatalog> ;
      const duplicateFolder = await CatalogDb.find(filter).exec();
      if (!!duplicateFolder && duplicateFolder.length > 0) { throw new Error('Duplicate Catalog Folder Found.'); }
      const folder = new CatalogDb(catalog);
      const newFolder = await folder.save();
      return newFolder;
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Creates new catalog root folder
   */
  public async setCatalogRootFolder(): Promise<ICatalog | undefined> {
    try {
      const rootJson = {
        isFile: false,
        name: 'Root Folder',
        path: ''
      };
      const conditions: FilterQuery<ICatalog> = rootJson;
      const fields: UpdateQuery<ICatalog> = rootJson;
      const catalogRootFolder = await CatalogDb.findOneAndUpdate(
        conditions,
        fields,
        {
          upsert: true
        }
      ).exec();
      if (!!catalogRootFolder) {
        logger.info(`Setting catalog root folder: ${JSON.stringify(catalogRootFolder)}\n`);
        return catalogRootFolder;
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Updates catalog item
   * @param payload
   * @param ossDesignUrn
   */
  public async updateCatalogFile(payload: { srcDesignUrn: string }, ossDesignUrn: string): Promise<ICatalog | undefined> {
    try {
      const conditions: FilterQuery<ICatalog> = payload;
      const fields: UpdateQuery<ICatalog> = { ossDesignUrn };
      const catalogFile = await CatalogDb.findOneAndUpdate(
        conditions,
        fields,
        {
          new: true
        }
      ).exec();
      if (!!catalogFile) { return catalogFile; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Updates catalog item glTF data
   * @param payload
   * @param gltf
   */
  public async updateCatalogFileGltf(
    payload: {
      isFile: boolean;
      isPublished: boolean;
      ossDesignUrn: string;
      svfUrn: string; },
    gltf: IGltf): Promise<ICatalog | undefined> {
    try {
      const conditions: FilterQuery<ICatalog> = payload;
      const fields: UpdateQuery<ICatalog> = { gltf };
      const catalogFile = await CatalogDb.findOneAndUpdate(
        conditions,
        fields,
        {
          new: true
        }
      ).exec();
      if (!!catalogFile) { return catalogFile; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Updates catalog item root filename
   * @param payload
   * @param rootFilename
   */
  public async updateCatalogFileRootFilename(payload: { isFile: boolean; srcDesignUrn: string }, rootFilename: string): Promise<ICatalog | undefined> {
    try {
      const conditions: FilterQuery<ICatalog> = payload;
      const fields: UpdateQuery<ICatalog> = { rootFilename };
      const catalogFile = await CatalogDb.findOneAndUpdate(
        conditions,
        fields,
        {
          new: true
        }
      ).exec();
      if (!!catalogFile) { return catalogFile; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Updates catalog item SVF urn
   * @param payload
   * @param svfUrn
   */
  public async updateCatalogFileSvf(payload: { isFile: boolean; ossDesignUrn: string }, svfUrn: string): Promise<ICatalog | undefined> {
    try {
      const conditions: FilterQuery<ICatalog> = payload;
      const fields: UpdateQuery<ICatalog> = { isPublished: true, svfUrn };
      const catalogFile = await CatalogDb.findOneAndUpdate(
        conditions,
        fields,
        {
          new: true
        }
      ).exec();
      if (!!catalogFile) { return catalogFile; }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Regular expression escape function
   * @param text
   */
  private escapeRegExp(text: string): string {
    logger.debug(`Converted ${text} to ${text.replace(/[-[\]{}()*+?.\\^|#]/g, '\\$&')}`);
    return text.replace(/[-[\]{}()*+?.\\^|#]/g, '\\$&');
  }

}
