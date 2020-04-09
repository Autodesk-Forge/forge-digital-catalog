import config from 'config';
import log4 from 'koa-log4';
import { ErrorHandler } from './error-handler';
import { OssHandler } from './oss-handler';
import { Context } from 'koa';

const logger = log4.getLogger('xref-handler');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

export class XrefHandler {

  private errorHandler: ErrorHandler;
  private ossHandler: OssHandler;

  public constructor() {
    this.errorHandler = new ErrorHandler();
    this.ossHandler = new OssHandler(config.get('oauth2.clientID'), config.get('oauth2.clientSecret'), config.get('bucket_scope'));
  }

  /**
   * Download CAD reference files
   * @param session
   * @param payload
   */
  public async downloadCADReferences(session: Context['session'], payload: any): Promise<any> {
    try {
      const downloadPromises = await Promise.all(payload.refs.map(async (ref: any) => {
        const refBucketKey = ref.location.split('/')[0].split(':')[3];
        const refObjectName = ref.location.split('/')[1];
        const srcFileName = ref.name;
        const downloadRef = await this.ossHandler.downloadObject(refBucketKey, refObjectName, srcFileName, session);
        if (!!downloadRef && downloadRef.status === 200) {
          if (ref.hasOwnProperty('children') && ref.children.length > 0) {
            const childPayload: any = {};
            childPayload.refs = ref.children;
            await this.downloadCADReferences(session, childPayload);
          }
          return downloadRef;
        }
      }));
      return downloadPromises;
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Creates list of CAD files to archive
   * @param payload
   */
  public setCADReferenceFilesList(payload: any): string[] | undefined {
    try {
      return payload.refs.reduce((fileNames: string[], ref: any) => {
        fileNames.push(ref.name);
        if (ref.hasOwnProperty('children') && ref.children.length > 0) {
          const childPayload: any = {};
          childPayload.refs = ref.children;
          const refList = this.setCADReferenceFilesList(childPayload) as ConcatArray<string>;
          fileNames = fileNames.concat(refList);
        }
        return fileNames;
      }, []);
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

}
