import { MongoMemoryServer } from "mongodb-memory-server";

import { Db, MongoClient } from 'mongodb';
import MongoProvider from "eve-esi-client-mongo-provider";


// Extend the default timeout so MongoDB binaries can download
jest.setTimeout(60000);

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

    async stop(provider: MongoProvider) {
        await provider.connection.close();
        await this.connection.close();
        return await this.server.stop();
    }

    async cleanup(collections: string[]) {
        for (let collection in collections) {
            await this.db.collection(collection).deleteMany({});
        }
    }
}