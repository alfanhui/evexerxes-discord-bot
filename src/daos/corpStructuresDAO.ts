import MongoProvider from 'eve-esi-client-mongo-provider';
import { CorpStructure } from '../api/corporation/structuresAPI';

const indexKey: string = "structure_id";
const index:{[key: string]: number} = {"structure_id": 1};

export class CorpStructuresQueries {

    static async createCollection(provider: MongoProvider, corporationId: number){
        return provider.connection.db.createCollection(`${corporationId}_structures`);
    }

    static async createIndex(provider: MongoProvider, corporationId: number) {
        await this.createCollection(provider, corporationId);
        if(await this.hasIndex(provider, corporationId)) return Promise.resolve();
        return await provider.connection.collection(corporationId.toString() + "_structures").createIndex(
            index,
            {
                unique: true
            }
        );
    }
    
    static async hasIndex(provider: MongoProvider, corporationId: number) {
        var indexes: {[key: string]:Array<Array<{[key: string]: number}>>} = (await provider.connection.collection(corporationId.toString() + "_structures").getIndexes());
        return indexes.hasOwnProperty(`${indexKey}_1`);
    }

    static async getStructure(provider: MongoProvider, corporationId: number, structure: CorpStructure): Promise<CorpStructure> {
        return await provider.connection.collection(corporationId.toString() + "_structures").findOne({ "structure_id": structure.structure_id });
    }

    static async getStructures(provider: MongoProvider, corporationId: number) {
        return await provider.connection.collection(corporationId.toString() + "_structures").find().toArray() as Array<CorpStructure>;
    }

    static async saveOrUpdateStructure(provider: MongoProvider, corporationId: number, structure: CorpStructure) {
        structure.previous_fuel_status = this.calculateCurrentFuelStatus(structure);
        return await provider.connection.collection(corporationId.toString() + "_structures").updateOne({ "structure_id": structure.structure_id }, { $set: structure }, { upsert: true });
    }

    static async removeOldStructures(provider: MongoProvider, corporationId: number, structure: Array<CorpStructure>) {
        var filter: Array<number> = structure.map((item) =>
            item.structure_id
        );
        //find with nor
        let oldStructures: Array<CorpStructure> = await provider.connection.collection(corporationId.toString() + "_structures").find({
            "structure_id": {
                $nin: filter
            }
        }).toArray();

        //delete structures that are returned
        this.deleteStructures(provider, corporationId, oldStructures);
    }

    static async deleteAll(provider: MongoProvider, corporationId: number) {
        return await provider.connection.collection(corporationId.toString() + "_structures").deleteMany({});
    }

    static async deleteStructure(provider: MongoProvider, corporationId: number, structure: CorpStructure) {
        if (!structure || structure == undefined) return Promise.resolve();
        return await provider.connection.collection(corporationId.toString() + "_structures").deleteOne({ "structure_id": structure.structure_id });
    }

    static async deleteStructures(provider: MongoProvider, corporationId: number, structure: Array<CorpStructure>) {
        if (!structure || structure == undefined || structure.length == 0) return Promise.resolve();
        var filter: Array<Object> = structure.map((item) => { return { "structure_id": item.structure_id } });
        return await provider.connection.collection(corporationId.toString() + "_structures").deleteMany({ $or: filter });
    }

    static async isPresent(provider: MongoProvider, corporationId: number, structure: CorpStructure) {
        return await provider.connection.collection(corporationId.toString() + "_structures").find({ "structure_id": structure.structure_id }).count() > 0;
    }

    static calculateCurrentFuelStatus(structure: CorpStructure):FuelNotify{
        if(!structure.fuel_expires) return FuelNotify.UNKNOWN;
        const fuelExpires: number = new Date(structure.fuel_expires).getTime();
        const remaining_time: number = fuelExpires - Date.now();
        if (remaining_time < 1) return FuelNotify.EMPTY;
        else if (remaining_time < 86400000)return FuelNotify.ONE_DAY;
        else if (remaining_time < 259200000) return FuelNotify.THREE_DAY;
        else if (remaining_time < 604800000) return FuelNotify.SEVEN_DAY;
        else return FuelNotify.SEVEN_DAY_PLUS;
    }

    static async getFuelNotifyStatus(provider: MongoProvider, corporationId: number, structure: CorpStructure): Promise<FuelNotify> {
        const previousStructureData: CorpStructure = await this.getStructure(provider, corporationId, structure);
        //if we have previous information, compare against
        
        //Get current fuel status
        var current_fuel_status: FuelNotify = this.calculateCurrentFuelStatus(structure);

        if (previousStructureData) {
            const previous_fuel_status: FuelNotify = previousStructureData.previous_fuel_status;
            //If there is a difference, notify!
            if (previous_fuel_status != current_fuel_status) return current_fuel_status;
            else return FuelNotify.NO_CHANGE;
        } else {
            return current_fuel_status;
        }
    }
}

export enum FuelNotify {
    SEVEN_DAY_PLUS,
    SEVEN_DAY,
    THREE_DAY,
    ONE_DAY,
    EMPTY,
    NO_CHANGE,
    UNKNOWN
}