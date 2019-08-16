const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const compress = require('koa-compress')
const cors = require('@koa/cors')
const helmet = require('koa-helmet')
const { historyApiFallback } = require('koa2-connect-history-api-fallback')
const log4js = require('koa-log4')
const passport = require('koa-passport')
const Router = require('koa-router')
const session = require('koa-session')
const serve = require('koa-static')

const mongoose = require('mongoose')

const app = new Koa()
const router = new Router()

const adminRoutes = require('./routes/admin')
const arvrRoutes = require('./routes/arvr-toolkit')
const authRoutes = require('./routes/auth')
const catalogRoutes = require('./routes/catalog')
const fusionRoutes = require('./routes/fusion')
const ossRoutes = require('./routes/oss')
const publishRoutes = require('./routes/publish')
const webHooksRoutes = require('./routes/webhooks')

const logger = log4js.getLogger('app')
if (process.env.NODE_ENV === 'development') { logger.level = 'debug' }

if (['development', 'production', 'test'].indexOf(process.env.NODE_ENV) < -1) {
    logger.error('... NODE_ENV value not valid. Please set environment accordingly and restart.')
    process.exit()
}

const config = require('config')

// Get 2-legged access token
const { getToken } = require('./helpers/auth')

// Create initial storage bucket
const { createBucket, getBucketInfo } = require('./helpers/oss-handler')

// Create webAdmins setting
const { initializeDb } = require('./controllers/admin')

mongoose
    .connect(
        config.get('db.url'), {
            useNewUrlParser: true
        }
    )
    .then(() => {
        logger.info('... MongoDB Connected')
        app.emit('ready')
    })
    .catch(err => {
        logger.error('Error occurred trying to connect to MongoDB', err)
    })

app.on('ready', () => {
    app.keys = [process.env.FORGE_CLIENT_ID || config.get('oauth2.clientID')]
    app.use(async (ctx, next) => {
        try {
            await next()
        } catch (err) {
            const { message, status, statusCode } = err
            ctx.status = statusCode || status || 500
            ctx.body = message
            ctx.app.emit('error', err, ctx)
        }
    })
    app.use(bodyParser())
    app.use(compress({
        flush: require('zlib').Z_SYNC_FLUSH,
        threshold: 2048
    }))
    app.use(cors({ credentials: true }))
    app.use(helmet())
    app.use(log4js.koaLogger(log4js.getLogger('http'), { level: 'auto' }))
    app.use(session({ 
        beforeSave: (ctx, sess) => {
            ctx.session.cookie = sess.cookie = config.get('session')
        }
    }, app))
    // Authentication
    require('./auth')
    app.use(passport.initialize())
    app.use(passport.session())
    app.use(adminRoutes.routes())
    app.use(arvrRoutes.routes())
    app.use(authRoutes.routes())
    app.use(catalogRoutes.routes())
    app.use(fusionRoutes.routes())
    app.use(ossRoutes.routes())
    app.use(publishRoutes.routes())
    app.use(webHooksRoutes.routes())
    if (process.env.NODE_ENV === 'production') { 
        app.use(historyApiFallback({ whiteList: ['/api'] }))
        app.use(serve('./www'))
    }
    // Logger
    app.use(async (ctx, next) => { 
        const start = new Date()
        await next()
        const ms = new Date() - start
        logger.info(`${ctx.method} ${ctx.url} - ${ms}ms`)
    })
    app.use(router.routes()).use(router.allowedMethods)
    const port = process.env.PORT || config.get('http_port')
    app.listen(port, async () => {
        const res = await getToken('oss')
        const accessToken = res.message.access_token
        logger.info(`Generated 2-legged access token: ${accessToken}`)
        const bucketInfo = await getBucketInfo(accessToken, config.get('bucket_key'))
        switch (bucketInfo.status) {
            case 200:
                logger.info(`Found bucket info: ${JSON.stringify(bucketInfo)}`)
                break
            case 404: {
                logger.info('... Attempting to create new bucket')
                const newBucket = await createBucket(accessToken, config.get('bucket_key'))
                logger.info(`Created new bucket: ${JSON.stringify(newBucket)}`)
                break
            } 
            default: 
                logger.error('Something went wrong trying to retrieve bucket info.')
        }
        await initializeDb()
        logger.info(`... Listening on port ${port}`)
    })
})

app.on('error', err => {
    logger.error('Server error', err)
})