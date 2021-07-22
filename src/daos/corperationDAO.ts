import MongoProvider from 'eve-esi-client-mongo-provider';

export class CorperationQueries {
    static async checkOrCreateCorperationCollection(provider: MongoProvider, corperationId: number) {
        return provider.connection.collection(corperationId.toString())
    }
}