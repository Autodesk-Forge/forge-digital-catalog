const mongoose = require('mongoose')

const config = require('config')

const { 
    getApplicationName,
    getCompanyLogo,
    getFeatureToggles,
    getFileFormatToggles,
    getSettingByNameAndEmail
 } = require('../src/server/controllers/admin')

/**
 * To do something once before all the tests run
 */
beforeAll(() => {
    mongoose.connect(
        config.get('db.url'), {
            useNewUrlParser: true
        }
    )
    .then(() => {
        console.info('... MongoDB Connected')
    })
    .catch(err => {
        console.error('Error occurred trying to connect to MongoDB', err)
    })
    console.info('... Jest starting')
})

/**
 * Tear down after all tests end
 */
afterAll(done => {
    mongoose.disconnect(done)
    console.info('... server closed')
})

describe(
    'Get Application Name', 
    () => {
        test('Get Application Name', async () => {
            const appName = await getApplicationName()
            expect(appName.status).toEqual(200)
            expect(typeof appName).toEqual('object')
            expect(Object.keys(appName).sort()).toEqual([
                'message',
                'status'
            ])
            expect(Array.isArray(appName.message)).toEqual(true)
            expect(typeof appName.message[0]).toEqual('object')
            expect(typeof appName.message[0].appName).toEqual('string')
            expect(typeof appName.message[0].name).toEqual('string')
            expect(Array.isArray(appName.message[0].webAdmins)).toEqual(true)
        })
})

describe(
    'Get Company Logo', 
    () => {
        test('Get Company Logo', async () => {
            const logo = await getCompanyLogo()
            expect(logo.status).toEqual(200)
            expect(typeof logo).toEqual('object')
            expect(Object.keys(logo).sort()).toEqual([
                'message',
                'status'
            ])
            expect(Array.isArray(logo.message)).toEqual(true)
            expect(typeof logo.message[0].name).toEqual('string')
            expect(logo.message[0].name).toEqual('companyLogo')
            expect(typeof logo.message[0].imageSrc).toEqual('string')
            expect(logo.message[0].imageSrc).toMatch(/^(data\:image\/png\;base64)/)
        })
})

describe(
    'Get Feature Toggles', 
    () => {
        test('Get Feature Toggles', async () => {
            const toggles = await getFeatureToggles()
            expect(toggles.status).toEqual(200)
            expect(typeof toggles).toEqual('object')
        })
})

describe(
    'Get File Formats',
    () => {
        test('Get File Formats', async () => {
            const formats = await getFileFormatToggles()
            expect(formats.status).toEqual(200)
            expect(typeof formats).toEqual('object')
        })
    }
)

describe(
    'Get Setting by Name and Email',
    () => {
        test('Get Settings by Name and Email', async () => {
            const name = 'defaultHubProject'
            const email = 'bastien.mazeran@autodesk.com'
            const setting = await getSettingByNameAndEmail(name, email)
            expect(setting.status).toEqual(200)
            expect(typeof setting).toEqual('object')
        })
    }
)