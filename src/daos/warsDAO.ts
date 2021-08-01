import MongoProvider from 'eve-esi-client-mongo-provider';
import { War } from '../api/warAPI';

const warsIndexKey1: string = "id";
const warsIndexKey2: string = "aggressor_corperation_id";
const warsIndexKey3: string = "defender_corperation_id";
const index: { [key: string]: number } = { warsIndexKey1: 1, warsIndexKey2: 1, warsIndexKey3: 1 };

export class WarsQueries {

    static async createCollection(provider: MongoProvider) {
        return provider.connection.db.createCollection(`wars`);
    }

    static async createIndex(provider: MongoProvider) {
        await this.createCollection(provider);
        if (await this.hasIndex(provider)) return Promise.resolve();
        return await provider.connection.collection("wars").createIndex(
            index,
            {
                unique: true
            }
        );
    }

    static async hasIndex(provider: MongoProvider) {
        var indexes: { [key: string]: Array<Array<{ [key: string]: number }>> } = (await provider.connection.collection("wars").getIndexes());
        return indexes.hasOwnProperty(`${warsIndexKey1}_1`);
    }

    static async getWar(provider: MongoProvider, warId: number): Promise<War> {
        return await provider.connection.collection("wars").findOne({ "id": warId });
    }

    static async getWars(provider: MongoProvider) {
        return await provider.connection.collection("wars").find().toArray() as Array<War>;
    }

    static async saveOrUpdateWar(provider: MongoProvider, war: War) {
        return await provider.connection.collection("wars").updateOne({ "id": war.id }, { $set: war }, { upsert: true });
    }

    static async removeOldWars(provider: MongoProvider, filter: Array<number>) {

        //find with nor
        let oldWars: Array<War> = await provider.connection.collection("wars").find({
            "id": {
                $nin: filter
            }
        }).toArray();

        //delete wars that are returned
        this.deleteWars(provider, oldWars);
    }

    static async deleteAll(provider: MongoProvider) {
        return await provider.connection.collection("wars").deleteMany({});
    }

    static async deleteWar(provider: MongoProvider, war: War) {
        if (!war || war == undefined) return Promise.resolve();
        return await provider.connection.collection("wars").deleteOne({ "id": war.id });
    }

    static async deleteWars(provider: MongoProvider, wars: Array<War>) {
        if (!wars || wars == undefined || wars.length == 0) return Promise.resolve();
        var filter: Array<Object> = wars.map((war) => { return { "id": war.id } });
        return await provider.connection.collection("wars").deleteMany({ $or: filter });
    }

    static async isPresent(provider: MongoProvider, war: War) {
        return await provider.connection.collection("wars").find({ "id": war.id }).count() > 0;
    }

    static async getAllNotSavedYet(provider: MongoProvider, newWars: Array<number>) {
        const notTheseWars :Array<War> = await provider.connection.collection("wars").find({
            "id": {
                $in: newWars
            }
        }).toArray();
        var filter: Array<Object> = notTheseWars.map((war) => war.id);
        return newWars.filter(war => !filter.includes(war));
    }
}