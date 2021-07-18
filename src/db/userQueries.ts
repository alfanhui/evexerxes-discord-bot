import MongoProvider from 'eve-esi-client-mongo-provider';

export interface CharacterMongo {
    owner: string
    characterId: number
    characterName: string
    createdOn: Date
    lastLoggedIn: Date
}

export class UserQueries {
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
        let characters: Array<CharacterMongo> = new Array();
        await response.forEach((item) =>
            characters.push(item)
        );
        return characters;
    }

    static async deleteAccount(provider: MongoProvider, characterId: string) {
        return await provider.connection.db.collection('characters').deleteOne({ "characterId": characterId });
    }

    static async deleteCharacter(provider: MongoProvider, characterId: string) {
        return await provider.connection.db.collection('characters').deleteOne({ "characterId": characterId });
    }
}