import axios, { AxiosResponse } from 'axios';
import * as config from 'config';
import { ErrorHandler } from './error-handler';

export class ForgeHandler {

  private errorHandler: ErrorHandler;

  constructor() {
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Retrieve manifest JSON
   * @param urn
   * @param token
   */
  async getManifest(urn: string, token: string): Promise<AxiosResponse | undefined> {
    try {
      let url;
      switch (config.get('region')) {
        case 'US':
          url = `${config.get('API_derivative_host')}/designdata/${urn}/manifest`;
          break;
        case 'EMEA':
          url = `${config.get('API_derivative_host')}/regions/eu/designdata/${urn}/manifest`;
          break;
        default:
          url = `${config.get('API_derivative_host')}/designdata/${urn}/manifest`;
      }
      const res = await axios({
        headers: {
          Authorization: `Bearer ${token}`
        },
        method: 'GET',
        url
      });
      if (res.status !== 200) { throw new Error(res.data); }
      return res.data;
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieve the derivatives
   * @param urn
   * @param token
   */
  async getDerivative(urn: string, token: string): Promise<Buffer | undefined> {
    try {
      const res = await axios({
        headers: {
          Authorization: `Bearer ${token}`
        },
        method: 'GET',
        responseType: 'arraybuffer',
        url: `${config.get('API_derivative_service')}/derivatives/${urn}`
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
  traverseManifest(node: any, callback: (node: any) => void): void {
    callback(node);
    if (node.derivatives) {
      for (const child of node.derivatives) {
        this.traverseManifest(child, callback);
      }
    } else if (node.children) {
      for (const child of node.children) {
        this.traverseManifest(child, callback);
      }
    }
  }

}
