import cors from '@koa/cors';
import Router from '@koa/router';
import config from 'config';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import compress from 'koa-compress';
import helmet from 'koa-helmet';
import log4js from 'koa-log4';
import passport from 'koa-passport';
import session from 'koa-session';
import serve from 'koa-static';
import { historyApiFallback } from 'koa2-connect-history-api-fallback';
import { connect } from 'mongoose';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import catalogRoutes from './routes/catalog';
import fusionRoutes from './routes/fusion';
import ossRoutes from './routes/oss';
import publishRoutes from './routes/publish';
import webHooksRoutes from './routes/webhooks';

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
    gzip: {
      flush: require('zlib').Z_SYNC_FLUSH
    },
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
  // eslint-disable-next-line @typescript-eslint/unbound-method
  app.use(router.routes()).use(router.allowedMethods);
  adminController.wakeUp().then(() => {
    const port = (process.env.PORT || config.get('http_port')) as number;
    app.listen(port, () => {
      logger.info('... Successfully initialized the database');
      logger.info(`... Listening at port ${port}`);
    });
  });
});

app.on('error', (err) => {
    logger.error('Server error', err);
});
