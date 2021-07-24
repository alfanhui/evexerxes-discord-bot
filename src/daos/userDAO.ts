import MongoProvider from 'eve-esi-client-mongo-provider';

export interface CharacterMongo {
    owner: string
    characterId: number
    characterName: string
    createdOn: Date
    lastLoggedIn: Date
}

const accountsCollection: string = "accounts";
const charactersCollection: string = "characters";

export class UserQueries {
    static async getAccounts(provider: MongoProvider) {
        return await provider.connection.db.collection(accountsCollection).find().toArray() as Array<string>;
    }

    static async getCharacters(provider: MongoProvider) {
        return await provider.connection.db.collection(charactersCollection).find().toArray() as Array<CharacterMongo>;
    }

    static async deleteAccount(provider: MongoProvider, characterId: string) {
        return await provider.connection.db.collection(charactersCollection).deleteOne({ characterId });
    }

    static async deleteCharacter(provider: MongoProvider, characterId: string) {
        return await provider.connection.db.collection(charactersCollection).deleteOne({ characterId });
    }
}