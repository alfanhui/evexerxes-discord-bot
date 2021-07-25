import MongoProvider from 'eve-esi-client-mongo-provider';
import { Structure } from '../api/corperation/structuresAPI';

const indexKey: string = "structure_id";
const index:{[key: string]: number} = {"structure_id": 1};

export class StructuresQueries {

    static async createCollection(provider: MongoProvider, corperationId: number){
        return provider.connection.db.createCollection(`${corperationId}_structures`);
    }

    static async createIndex(provider: MongoProvider, corperationId: number) {
        await this.createCollection(provider, corperationId);
        if(await this.hasIndex(provider, corperationId)) return Promise.resolve();
        return await provider.connection.collection(corperationId.toString() + "_structures").createIndex(
            index,
            {
                unique: true
            }
        );
    }
    
    static async hasIndex(provider: MongoProvider, corperationId: number) {
        var indexes: {[key: string]:Array<Array<{[key: string]: number}>>} = (await provider.connection.collection(corperationId.toString() + "_structures").getIndexes());
        return indexes.hasOwnProperty(`${indexKey}_1`);
    }

    static async getStructure(provider: MongoProvider, corperationId: number, structure: Structure): Promise<Structure> {
        return await provider.connection.collection(corperationId.toString() + "_structures").findOne({ "structure_id": structure.structure_id });
    }

    static async getStructures(provider: MongoProvider, corperationId: number) {
        return await provider.connection.collection(corperationId.toString() + "_structures").find().toArray() as Array<Structure>;
    }

    static async saveOrUpdateStructure(provider: MongoProvider, corperationId: number, structure: Structure) {
        return await provider.connection.collection(corperationId.toString() + "_structures").updateOne({ "structure_id": structure.structure_id }, { $set: structure }, { upsert: true });
    }

    static async removeOldStructures(provider: MongoProvider, corperationId: number, structure: Array<Structure>) {
        var filter: Array<number> = structure.map((item) =>
            item.structure_id
        );
        //find with nor
        let oldStructures: Array<Structure> = await provider.connection.collection(corperationId.toString() + "_structures").find({
            "structure_id": {
                $nin: filter
            }
        }).toArray();

        //delete structures that are returned
        this.deleteStructures(provider, corperationId, oldStructures);
    }

    static async deleteStructure(provider: MongoProvider, corperationId: number, structure: Structure) {
        if (!structure || structure == undefined) return Promise.resolve();
        return await provider.connection.collection(corperationId.toString() + "_structures").deleteOne({ "structure_id": structure.structure_id });
    }

    static async deleteStructures(provider: MongoProvider, corperationId: number, structure: Array<Structure>) {
        if (!structure || structure == undefined || structure.length == 0) return Promise.resolve();
        var filter: Array<Object> = structure.map((item) => { return { "structure_id": item.structure_id } });
        return await provider.connection.collection(corperationId.toString() + "_structures").deleteMany({ $or: filter });
    }

    static async isPresent(provider: MongoProvider, corperationId: number, structure: Structure) {
        return await provider.connection.collection(corperationId.toString() + "_structures").find({ "structure_id": structure.structure_id }).count() > 0;
    }

    static async getFuelNotifyStatus(provider: MongoProvider, corperationId: number, structure: Structure): Promise<FuelNotify> {
        const previousStructureData: Structure = await this.getStructure(provider, corperationId, structure);
        //if we have previous information, compare against
        const fuel_expires: number = Date.parse(structure.fuel_expires);

        //Get current fuel status
        var current_fuel_status: FuelNotify = FuelNotify.UNKNOWN;
        const remaining_time: number = Date.now() - fuel_expires;
        if (remaining_time > 604800000) current_fuel_status = FuelNotify.SEVEN_DAY;
        else if (remaining_time > 259200000) current_fuel_status = FuelNotify.THREE_DAY;
        else if (remaining_time > 86400000) current_fuel_status = FuelNotify.ONE_DAY;
        else if (remaining_time < 1) current_fuel_status = FuelNotify.EMPTY;

        if (previousStructureData) {
            const previous_fuel_status: FuelNotify = previousStructureData.previous_fuel_status;
            //If there is a difference, notify!
            if (previous_fuel_status != current_fuel_status) return current_fuel_status;
        } else {
            return current_fuel_status;
        }
        return FuelNotify.NO_CHANGE;
    }
}

export enum FuelNotify {
    SEVEN_DAY,
    THREE_DAY,
    ONE_DAY,
    EMPTY,
    NO_CHANGE,
    UNKNOWN
}