import MongoProvider from 'eve-esi-client-mongo-provider';
import { War } from '../api/warAPI';
import { isEqual } from 'lodash';

const indexKey1: string = "id";
const index: { [key: string]: number } = { indexKey1: 1 };

export interface CorpWar {
    id: number
}

export class CorpWarsQueries {
    static async createCollection(provider: MongoProvider, corporationId: number) {
        return provider.connection.db.createCollection(corporationId.toString() + "wars");
    }

    static async createIndex(provider: MongoProvider, corporationId: number) {
        await this.createCollection(provider,corporationId);
        if (await this.hasIndex(provider, corporationId)) return Promise.resolve();
        return await provider.connection.collection(corporationId.toString() + "wars").createIndex(
            index,
            {
                unique: true
            }
        );
    }

    static async hasIndex(provider: MongoProvider, corporationId: number) {
        var indexes: { [key: string]: Array<Array<{ [key: string]: number }>> } = (await provider.connection.collection(corporationId.toString() + "wars").getIndexes());
        return indexes.hasOwnProperty(`${indexKey1}_1`);
    }
    static async getCorpWars(provider: MongoProvider, corporationId: number) {
        return await provider.connection.collection(corporationId.toString() + "wars").find().toArray() as Array<CorpWar>;
    }

    static async saveOrUpdateWar(provider: MongoProvider, corporationId: number, war: CorpWar) {
        return await provider.connection.collection(corporationId.toString() + "wars").updateOne({ "id": war.id }, { $set: war }, { upsert: true });
    }

    static async removeOldWars(provider: MongoProvider, corporationId: number, wars: Array<CorpWar>) {
        if(!wars || wars.length < 1) return Promise.resolve();
        var filter: Array<number> = wars.map((war) =>
            war.id
        );
        //find with nor
        let oldWars: Array<CorpWar> = await provider.connection.collection(corporationId.toString() + "wars").find({
            "id": {
                $nin: filter
            }
        }).toArray();

        //delete wars that are returned
        this.deleteWars(provider, corporationId, oldWars);
    }

    static async deleteAll(provider: MongoProvider, corporationId: number) {
        return await provider.connection.collection(corporationId.toString() + "wars").deleteMany({});
    }

    static async deleteWar(provider: MongoProvider, corporationId: number, corpWar: CorpWar) {
        if (!corpWar || corpWar == undefined) return Promise.resolve();
        return await provider.connection.collection(corporationId.toString() + "wars").deleteOne({ "id": corpWar.id });
    }

    static async deleteWars(provider: MongoProvider, corporationId: number, corpWars: Array<CorpWar>) {
        if (!corpWars || corpWars == undefined || corpWars.length == 0) return Promise.resolve();
        var filter: Array<Object> = corpWars.map((corpWar) => { return { "id": corpWar.id } });
        return await provider.connection.collection(corporationId.toString() + "wars").deleteMany({ $or: filter });
    }

    static async isPresent(provider: MongoProvider, corporationId: number, corpWar: War) {
        return await provider.connection.collection(corporationId.toString() + "wars").find({ "id": corpWar.id }).count() > 0;
    }

    static async hasChanged(provider: MongoProvider, corporationId: number, corpWar: War) {
        const existingWar = await provider.connection.collection(corporationId.toString() + "wars").findOne({ "id": corpWar.id });
        delete existingWar._id;
        if(!existingWar) return true;
        if(!isEqual(corpWar, existingWar)) return true;
        return false;
    }
} 