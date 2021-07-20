import { MongoMemoryServer } from "mongodb-memory-server";

import { Db, MongoClient } from 'mongodb';
import MongoProvider from "eve-esi-client-mongo-provider";


// Extend the default timeout so MongoDB binaries can download
jest.setTimeout(60000);

// List your collection names here
const COLLECTIONS = ['12345_contracts'];

export class DBManager {
    db: Db;
    server: MongoMemoryServer;
    connection: MongoClient;

    constructor() {
        this.db = null;
        this.server = null;
        this.connection = null;
    }

    async start() {
        this.server = await MongoMemoryServer.create();
        const url = this.server.getUri();
        this.connection = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
        this.db = this.connection.db('esi');
        return url;
    }

    stop(provider: MongoProvider) {
        provider.connection.close();
        this.connection.close();
        return this.server.stop();
    }

    async cleanup() {
        for (let collection in COLLECTIONS) {
            await this.db.collection(collection).deleteMany({});
        }
    }
}