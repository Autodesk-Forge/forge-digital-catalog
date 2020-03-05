import { MongoClient } from 'mongodb';
import MongoUri from 'mongodb-uri';

import config from 'config';

// tslint:disable-next-line: no-console
console.info(`config: ${JSON.stringify(config)}`);
const url: string = config.get('db.url');

MongoClient.connect(url, (connectErr: Error, db) => {
    if (connectErr) throw { connectErr };
    const mongoUri = MongoUri.parse(url);
    const dbo = db.db(mongoUri.database);
    const query = {};
    dbo
        .collection('catalogs')
        .remove(query, (catalogsErr: Error, result) => {
            if (catalogsErr) { throw catalogsErr; }
            // tslint:disable-next-line: no-console
            console.log(`... removed catalog collection: ${result}`);
        });
    dbo
        .collection('publishjobs')
        .remove(query, (publishjobsErr: Error, result) => {
            if (publishjobsErr) { throw publishjobsErr; }
            // tslint:disable-next-line: no-console
            console.log(`... removed publishjobs collection: ${result}`);
        });
    dbo
        .collection('settings')
        .remove(query, (settingsErr: Error, result) => {
            if (settingsErr) { throw settingsErr; }
            // tslint:disable-next-line: no-console
            console.log(`... removed settings collection: ${result}`);
        });
    db.close();
});
