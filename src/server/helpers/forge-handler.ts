import axios, { AxiosResponse } from 'axios';
import config from 'config';
import { ErrorHandler } from './error-handler';
import { IDerivative, IDerivativeChild, IManifest } from '../../shared/publish';

const apiDerivativeHost: string = config.get('API_derivative_host');
const apiDerivativeService: string = config.get('API_derivative_service');

export class ForgeHandler {

  private errorHandler: ErrorHandler;

  public constructor() {
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Retrieve manifest JSON
   * @param urn
   * @param token
   */
  public async getManifest(urn: string, token: string): Promise<AxiosResponse<IManifest> | undefined> {
    try {
      let url;
      switch (config.get('region')) {
        case 'US':
          url = `${apiDerivativeHost}/designdata/${urn}/manifest`;
          break;
        case 'EMEA':
          url = `${apiDerivativeHost}/regions/eu/designdata/${urn}/manifest`;
          break;
        default:
          url = `${apiDerivativeHost}/designdata/${urn}/manifest`;
      }
      const res = await axios({
        headers: {
          Authorization: `Bearer ${token}`
        },
        method: 'GET',
        url
      });
      if (res.status !== 200) { throw new Error(res.data); }
      const manifest = res.data as AxiosResponse<IManifest>;
      return manifest;
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieve the derivatives
   * @param urn
   * @param token
   */
  public async getDerivative(urn: string, token: string): Promise<Buffer | undefined> {
    try {
      const res = await axios({
        headers: {
          Authorization: `Bearer ${token}`
        },
        method: 'GET',
        responseType: 'arraybuffer',
        url: `${apiDerivativeService}/derivatives/${urn}`
      });
      if (res.status !== 200) {
        const message = await res.data.text();
        throw new Error(message);
      }
      const buffer = Buffer.from(res.data);
      return buffer;
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Traverse the manifest JSON data
   * @param node
   * @param callback
   */
  public traverseManifest(node: IManifest | IDerivative | IDerivativeChild, callback: (childNode: IManifest | IDerivative | IDerivativeChild) => void): void {
    callback(node);
    if ('derivatives' in node) {
      for (const child of node.derivatives) {
        this.traverseManifest(child, callback);
      }
    } else if ('children' in node) {
      for (const child of node.children) {
        this.traverseManifest(child, callback);
      }
    }
  }

}
