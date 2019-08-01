const MongoClient = require('mongodb').MongoClient
const MongoUri = require('mongodb-uri')

const config = require('config')

console.info(`config: ${JSON.stringify(config)}`)
const url = config.get('db.url')

MongoClient.connect(url, function(connectErr, db) {
    if (connectErr) throw connectErr
    const mongoUri = MongoUri.parse(url)
    const dbo = db.db(mongoUri.database)
    const query = {}
    dbo
        .collection('catalogs')
        .remove(query, function(catalogsErr, result) {
            if (catalogsErr) throw catalogsErr
            console.log(`... removed catalog collection: ${result}`)
        })
    dbo
        .collection('publishjobs')
        .remove(query, function(publishjobsErr, result) {
            if (publishjobsErr) throw publishjobsErr
            console.log(`... removed publishjobs collection: ${result}`)
        })
    dbo
        .collection('settings')
        .remove(query, function(settingsErr, result) {
            if (settingsErr) throw settingsErr
            console.log(`... removed settings collection: ${result}`)
        })
    db.close()
})
