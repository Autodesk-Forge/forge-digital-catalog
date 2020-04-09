import { AxiosError } from 'axios';
import log4 from 'koa-log4';
import { Context } from 'koa';

const logger = log4.getLogger('error-handler');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

export class ErrorHandler {

  public handleError(err: Error, ctx?: Context): void {
    if (err instanceof Error) {
      const axiosError = err as AxiosError;
      if (axiosError.response) {
        /* The request was made and the server responded with a status code
        that falls outside of the range of 2xx */
        logger.error(`[${axiosError.response.status}] response.data - ${JSON.stringify(axiosError.response.data)}`);
        if (axiosError.response.status === 401 && ctx) {
          logger.info('[401] - redirecting to login page');
          ctx.status = 301;
          ctx.redirect('/login');
        }
      } else if (axiosError.request) {
        /* The request was made but no response was received
        err.request is an instance of http.ClientRequest in Node.js */
        logger.error(`request.message - ${axiosError.request.message}`);
        throw new Error(axiosError.request.message);
      } else {
        logger.error(`err.message - ${err.message}`);
        if (err.message === 'Found empty passport session' && ctx) {
          logger.error(`[401] err.message - ${err.message}`);
          logger.info('[401] - redirecting to login page');
          ctx.status = 301;
          ctx.redirect('/login');
        }
      }
    } else {
      throw err;
    }
  }
}
