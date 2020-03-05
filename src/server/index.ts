import * as cors from '@koa/cors';
import * as Router from '@koa/router';
import * as config from 'config';
import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as compress from 'koa-compress';
import * as helmet from 'koa-helmet';
import * as log4js from 'koa-log4';
import * as passport from 'koa-passport';
import * as session from 'koa-session';
import * as serve from 'koa-static';
import { historyApiFallback } from 'koa2-connect-history-api-fallback';
import { connect } from 'mongoose';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import catalogRoutes from './routes/catalog';
import fusionRoutes from './routes/fusion';
import ossRoutes from './routes/oss';
import publishRoutes from './routes/publish';
import webHooksRoutes from './routes/webhooks';

// Get 2-legged access token
import { AuthHelper } from './helpers/auth-handler';
const authHelper = new AuthHelper();

// Create initial storage bucket
import { OssHandler } from './helpers/oss-handler';
const ossHandler = new OssHandler(config.get('oauth2.clientID'), config.get('oauth2.clientSecret'), config.get('bucket_scope'));

// Create webAdmins setting
import { Admin } from './controllers/admin';
const adminController = new Admin();

const app = new Koa();
const router = new Router<Koa.DefaultState, Koa.Context>();

const logger = log4js.getLogger('app');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

if (process.env.NODE_ENV && ['development', 'production', 'test'].indexOf(process.env.NODE_ENV) < -1) {
  logger.error('... NODE_ENV value not valid. Please set environment accordingly and restart.');
  process.exit();
}

connect(
  config.get('db.url'), {
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
)
.then(() => {
  logger.info('... MongoDB Connected');
  app.emit('ready');
  return;
})
.catch((err) => {
  logger.error('Error occurred trying to connect to MongoDB', err);
});

app.on('ready', () => {
  app.keys = [process.env.FORGE_CLIENT_ID || config.get('oauth2.clientID')];
  app.use(async (ctx: Koa.Context, next: Koa.Next) => {
    try {
      await next();
    } catch (err) {
      const { message, status, statusCode } = err;
      ctx.status = statusCode || status || 500;
      ctx.body = message;
      ctx.app.emit('error', err, ctx);
    }
  });
  app.use(bodyParser());
  app.use(compress({
    flush: require('zlib').Z_SYNC_FLUSH,
    threshold: 2048
  }));
  app.use(cors({ credentials: true }));
  app.use(helmet());
  app.use(log4js.koaLogger(log4js.getLogger('http'), { level: 'auto' }));
  app.use(session({
    beforeSave: (ctx: Koa.Context, sess) => {
      if (ctx.session) { ctx.session.cookie = sess.cookie = config.get('session'); }
    }
  }, app));
  // Authentication
  require('./auth');
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(adminRoutes.routes());
  app.use(authRoutes.routes());
  app.use(catalogRoutes.routes());
  app.use(fusionRoutes.routes());
  app.use(ossRoutes.routes());
  app.use(publishRoutes.routes());
  app.use(webHooksRoutes.routes());
  if (process.env.NODE_ENV === 'production') {
    app.use(historyApiFallback({ whiteList: ['/api'] }));
    app.use(serve('./www'));
  }
  // Logger
  app.use(async (ctx: Koa.Context, next: Koa.Next) => {
    const start = new Date();
    await next();
    const ms = (new Date()).valueOf() - start.valueOf();
    logger.info(`${ctx.method} ${ctx.url} - ${ms}ms`);
  });
  app.use(router.routes()).use(router.allowedMethods);
  const port = (process.env.PORT || config.get('http_port')) as number;
  app.listen(port, async () => {
    const authToken = await authHelper.createInternalToken(config.get('bucket_scope'));
    if (authToken) {
      const accessToken = authToken.access_token;
      logger.info(`Generated 2-legged access token: ${accessToken}`);
      const bucketInfo = await ossHandler.getBucketInfo(authToken, config.get('bucket_key'));
      if (bucketInfo) {
        switch (bucketInfo.statusCode) {
          case 200:
            logger.info(`Found bucket info: ${JSON.stringify(bucketInfo.body)}`);
            break;
          case 404: {
            logger.info('... Attempting to create new bucket');
            const newBucket = await ossHandler.createBucket(authToken, config.get('bucket_key'));
            if (newBucket) { logger.info(`Created new bucket: ${JSON.stringify(newBucket.body)}`); }
            break;
          }
          default:
            logger.error('Something went wrong trying to retrieve bucket info.');
        }
      }
      await adminController.clearCache();
      logger.info('... Successfully cleared temporary cache');
      await adminController.initializeDb();
      logger.info('... Successfully initialized the database');
      logger.info(`... Listening at port ${port}`);
        }
    });
});

app.on('error', (err) => {
    logger.error('Server error', err);
});
