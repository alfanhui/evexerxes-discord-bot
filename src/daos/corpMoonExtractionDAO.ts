import MongoProvider from 'eve-esi-client-mongo-provider';
import { MoonExtraction } from '../api/corporation/moonExtractionAPI';

const indexKey: string = "structure_id";
const index:{[key: string]: number} = {"structure_id": 1};

export class CorpMoonExtractionsQueries {

    static async createCollection(provider: MongoProvider, corporationId: number){
        if((await provider.connection.db.listCollections({name: `${corporationId}_moon_extraction`}).toArray()).length == 0){
            return provider.connection.db.createCollection(`${corporationId}_moon_extraction`);
        }
    }

    static async createIndex(provider: MongoProvider, corporationId: number) {
        await this.createCollection(provider, corporationId);
        if(await this.hasIndex(provider, corporationId)) return Promise.resolve();
        return await provider.connection.collection(corporationId.toString() + "_moon_extraction").createIndex(
            index,
            {
                unique: true
            }
        );
    }
    
    static async hasIndex(provider: MongoProvider, corporationId: number) {
        var indexes: {[key: string]:Array<Array<{[key: string]: number}>>} = (await provider.connection.collection(corporationId.toString() + "_moon_extraction").getIndexes());
        return indexes.hasOwnProperty(`${indexKey}_1`);
    }

    static async getMoonExtraction(provider: MongoProvider, corporationId: number, extraction: MoonExtraction): Promise<MoonExtraction> {
        return await provider.connection.collection(corporationId.toString() + "_moon_extraction").findOne({ "structure_id": extraction.structure_id });
    }

    static async getMoonExtractions(provider: MongoProvider, corporationId: number) {
        return await provider.connection.collection(corporationId.toString() + "_moon_extraction").find().toArray() as Array<MoonExtraction>;
    }

    static async saveOrUpdateMoonExtraction(provider: MongoProvider, corporationId: number, extraction: MoonExtraction) {
        return await provider.connection.collection(corporationId.toString() + "_moon_extraction").updateOne({ "structure_id": extraction.structure_id }, { $set: extraction }, { upsert: true });
    }

    static async removeOldMoonExtractions(provider: MongoProvider, corporationId: number, extraction: Array<MoonExtraction>) {
        if(!extraction || extraction.length < 1) return Promise.resolve();
        var filter: Array<number> = extraction.map((item) =>
            item.structure_id
        );
        //find with nor
        let oldExtractions: Array<MoonExtraction> = await provider.connection.collection(corporationId.toString() + "_moon_extraction").find({
            "structure_id": {
                $nin: filter
            }
        }).toArray();

        //delete moon extraction that are returned
        this.deleteMoonExtractions(provider, corporationId, oldExtractions);
    }

    static async deleteAll(provider: MongoProvider, corporationId: number) {
        return await provider.connection.collection(corporationId.toString() + "_moon_extraction").deleteMany({});
    }

    static async deleteMoonExtraction(provider: MongoProvider, corporationId: number, extraction: MoonExtraction) {
        if (!extraction || extraction == undefined) return Promise.resolve();
        return await provider.connection.collection(corporationId.toString() + "_moon_extraction").deleteOne({ "structure_id": extraction.structure_id });
    }

    static async deleteMoonExtractions(provider: MongoProvider, corporationId: number, extractions: Array<MoonExtraction>) {
        if (!extractions || extractions == undefined || extractions.length == 0) return Promise.resolve();
        var filter: Array<Object> = extractions.map((item) => { return { "structure_id": item.structure_id } });
        return await provider.connection.collection(corporationId.toString() + "_moon_extraction").deleteMany({ $or: filter });
    }

    static async isPresent(provider: MongoProvider, corporationId: number, extraction: MoonExtraction) {
        return await provider.connection.collection(corporationId.toString() + "_moon_extraction").find({ "structure_id": extraction.structure_id }).count() > 0;
    }

    static async isNotifiable(provider: MongoProvider, corporationId: number, extraction: MoonExtraction) {
        return Promise.resolve(()=>true);
        const previousExtraction:MoonExtraction = await this.getMoonExtraction(provider, corporationId, extraction);
        if(previousExtraction?.has_been_notified) return false;
        if(new Date(Date.parse(extraction.chunk_arrival_time)).getUTCDay() == new Date().getUTCDay()){
              return true; 
        }
        return false;
    }
}