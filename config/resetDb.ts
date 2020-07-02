import { MongoClient, WriteOpResult } from 'mongodb';
import MongoUri from 'mongodb-uri';
import config from 'config';

console.info(`configuration: ${JSON.stringify(config)}`);
const url: string = config.get('db.url');

MongoClient.connect(url, (connectErr: Error, db) => {
    if (connectErr) { throw connectErr; }
    const mongoUri = MongoUri.parse(url);
    const dbo = db.db(mongoUri.database);
    const query = {};
    dbo
        .collection('catalogs')
        .remove(query, (catalogsErr: Error, result: WriteOpResult) => {
            if (catalogsErr) { throw catalogsErr; }
            console.info(`... removed catalog collection: ${JSON.stringify(result.result)}`);
        });
    dbo
        .collection('publishjobs')
        .remove(query, (publishjobsErr: Error, result: WriteOpResult) => {
            if (publishjobsErr) { throw publishjobsErr; }
            console.info(`... removed publishjobs collection: ${JSON.stringify(result.result)}`);
        });
    dbo
        .collection('settings')
        .remove(query, (settingsErr: Error, result: WriteOpResult) => {
            if (settingsErr) { throw settingsErr; }
            console.info(`... removed settings collection: ${JSON.stringify(result.result)}`);
        });
    void db.close();
});
