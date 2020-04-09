import axios, { AxiosResponse } from 'axios';
import config from 'config';
import log4 from 'koa-log4';
import { AuthHelper } from '../helpers/auth-handler';
import { ErrorHandler } from '../helpers/error-handler';

const logger = log4.getLogger('webhooks');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

axios.defaults.withCredentials = true;

export class WebHooks {

  private authHelper: AuthHelper;
  private errorHandler: ErrorHandler;

  public constructor() {
    this.authHelper = new AuthHelper();
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Delete Webhook
   * @param hookId
   */
  public async deleteWebHook(hookId: string): Promise<AxiosResponse | undefined> {
    try {
      const authToken = await this.authHelper.createInternalToken(config.get('bucket_scope'));
      if (!!authToken) {
        const res = await axios({
          headers: {
            'Authorization': `Bearer ${authToken.access_token}`,
            'Content-Type': 'application/json'
          },
          method: 'DELETE',
          url: `${config.get(
            'API_webhook_host'
          )}/systems/derivative/events/extraction.finished/hooks/${hookId}`
        });
        if (res.status === 204) { return res; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Retrieves Webhooks
   */
  public async getWebHooks(): Promise<AxiosResponse | undefined> {
    try {
      const authToken = await this.authHelper.createInternalToken(config.get('bucket_scope'));
      if (!!authToken) {
        const res = await axios({
          headers: {
            Authorization: `Bearer ${authToken.access_token}`
          },
          method: 'GET',
          url: `${config.get(
            'API_webhook_host'
          )}/systems/derivative/events/extraction.finished/hooks`
        });
        if (res.status === 200) { return res; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

  /**
   * Creates Model Derivative WebHook
   */
  public async setWebHook(): Promise<AxiosResponse | undefined> {
    try {
      const authToken = await this.authHelper.createInternalToken(config.get('bucket_scope'));
      if (!!authToken) {
        const callbackUrl = (process.env.NODE_ENV === 'production') ? config.get('webhook.callbackURL') : config.get('ngrok.callbackURL');
        const data = {
          callbackUrl,
          scope: {
            workflow: config.get('webhook.workflow')
          }
        };
        const res = await axios({
          data,
          headers: {
            'Authorization': `Bearer ${authToken.access_token}`,
            'Content-Type': 'application/json'
          },
          method: 'POST',
          url: `${config.get(
            'API_webhook_host'
          )}/systems/derivative/events/extraction.finished/hooks`
        });
        if (res.status === 201) { return res; }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

}
