import MongoProvider from 'eve-esi-client-mongo-provider';
export class DatabaseQueries {
    static async getAccounts(provider: MongoProvider) {
        let response = provider.connection.db.collection('accounts').find();
        let owners: Array<string> = new Array();
        await response.forEach((item) =>
            owners.push(item.owner)
        );
        return owners;
    }

    static async getCharacters(provider: MongoProvider) {
        let response = provider.connection.db.collection('characters').find();
        let owners: Array<string> = new Array();
        await response.forEach((item) =>
            owners.push(item.owner)
        );
        return owners;
    }
}