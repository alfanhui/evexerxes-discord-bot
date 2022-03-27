import MongoProvider from 'eve-esi-client-mongo-provider';
import { Blueprint } from '../api/corporation/blueprintsAPI';
import { ActivityIndex, Industry, IStatus } from '../api/corporation/IndustryAPI';
import { Type } from '../api/universe/typeAPI';

const indexKey: string = "item_id";
const index: { [key: string]: number } = { "item_id": 1 };

export interface BlueprintDAOModel {
    item_id: number
    type_id: number
    name: string
    material_efficiency: number
    material_efficiency_increase: number
    time_efficiency: number
    time_efficiency_increase: number
    runs_made: number
    copies_made: number
    status: IStatus
    current_activity: string
}

export function serialiseBlueprintDAOModel(blueprint: Blueprint, industry: Industry, type: Type): BlueprintDAOModel {
    let blueprintDAOModel: BlueprintDAOModel = {} as BlueprintDAOModel;
    blueprintDAOModel.name = type.name;
    blueprintDAOModel.item_id = industry.blueprint_id;
    blueprintDAOModel.type_id = type.type_id;
    blueprintDAOModel.material_efficiency = blueprint.material_efficiency;
    blueprintDAOModel.time_efficiency = blueprint.time_efficiency;
    blueprintDAOModel.material_efficiency_increase = blueprintDAOModel.time_efficiency_increase = blueprintDAOModel.runs_made = blueprintDAOModel.copies_made = 0;
    return updateBlueprintDAOModel(blueprintDAOModel, industry);
}

export function updateBlueprintDAOModel(blueprintDAOModel: BlueprintDAOModel, industry: Industry): BlueprintDAOModel {
    //Strangely, items that have ended show up as still active..
    blueprintDAOModel.status = new Date(Date.parse(industry.end_date)).getTime() < (Date.now()) ? IStatus['ready'] : industry.status;
    blueprintDAOModel.current_activity = ActivityIndex[industry.activity_id];

    if (industry.status == IStatus.ready || industry.status == IStatus.delivered) {
        switch (industry.activity_id) {
            case ActivityIndex.manufacturing:
                blueprintDAOModel.copies_made += industry.runs;
                break;
            case ActivityIndex.copying:
                blueprintDAOModel.copies_made += industry.runs;
                break;
            case ActivityIndex.researching_material_efficiency:
                blueprintDAOModel.material_efficiency_increase += 1;
                break;
            case ActivityIndex.researching_time_efficiency:
                blueprintDAOModel.time_efficiency_increase += 1;
                break;
            case ActivityIndex.invention:
            case ActivityIndex.reactions:
            case ActivityIndex.reverse_engineering:
                break;
            default:
                console.error("Unknown Activity ID")
                break;
        }
    }
    return blueprintDAOModel;
}



export class CorpBlueprintDAOModelQueries {

    static async createCollection(provider: MongoProvider, corporationId: number) {
        if ((await provider.connection.db.listCollections({ name: `${corporationId}_blueprints` }).toArray()).length == 0) {
            return provider.connection.db.createCollection(`${corporationId}_blueprints`);
        }
    }

    static async createIndex(provider: MongoProvider, corporationId: number) {
        await this.createCollection(provider, corporationId);
        if (await this.hasIndex(provider, corporationId)) return Promise.resolve();
        return await provider.connection.collection(corporationId.toString() + "_blueprints").createIndex(
            index,
            {
                unique: true
            }
        );
    }

    static async hasIndex(provider: MongoProvider, corporationId: number) {
        var indexes: { [key: string]: Array<Array<{ [key: string]: number }>> } = (await provider.connection.collection(corporationId.toString() + "_blueprints").getIndexes());
        return indexes.hasOwnProperty(`${indexKey}_1`);
    }

    static async getBlueprintDAOModel(provider: MongoProvider, corporationId: number, blueprintId: Number): Promise<BlueprintDAOModel> {
        return await provider.connection.collection(corporationId.toString() + "_blueprints").findOne({ "item_id": blueprintId });
    }

    static async getBlueprintDAOModels(provider: MongoProvider, corporationId: number) {
        return await provider.connection.collection(corporationId.toString() + "_blueprints").find().toArray() as Array<BlueprintDAOModel>;
    }

    static async saveOrUpdateBlueprintDAOModel(provider: MongoProvider, corporationId: number, blueprint: BlueprintDAOModel) {
        return await provider.connection.collection(corporationId.toString() + "_blueprints").updateOne({ "item_id": blueprint.item_id }, { $set: blueprint }, { upsert: true });
    }

    static async removeOldBlueprintDAOModels(provider: MongoProvider, corporationId: number, blueprints: Array<BlueprintDAOModel>) {
        if (blueprints == null || blueprints.length < 1) return Promise.resolve();
        var filter: Array<number> = blueprints.map((item) =>
            item.item_id
        );
        //find with nor
        let oldBlueprintDAOModels: Array<BlueprintDAOModel> = await provider.connection.collection(corporationId.toString() + "_blueprints").find({
            "item_id": {
                $nin: filter
            }
        }).toArray();

        //delete blueprints that are returned
        this.deleteBlueprintDAOModels(provider, corporationId, oldBlueprintDAOModels);
    }

    static async deleteAll(provider: MongoProvider, corporationId: number) {
        return await provider.connection.collection(corporationId.toString() + "_blueprints").deleteMany({});
    }

    static async deleteBlueprintDAOModel(provider: MongoProvider, corporationId: number, blueprint: BlueprintDAOModel) {
        if (blueprint == null) return Promise.resolve();
        return await provider.connection.collection(corporationId.toString() + "_blueprints").deleteOne({ "item_id": blueprint.item_id });
    }

    static async deleteBlueprintDAOModels(provider: MongoProvider, corporationId: number, blueprints: Array<BlueprintDAOModel>) {
        if (blueprints == null || blueprints.length == 0) return Promise.resolve();
        var filter: Array<Object> = blueprints.map((item) => { return { "item_id": item.item_id } });
        return await provider.connection.collection(corporationId.toString() + "_blueprints").deleteMany({ $or: filter });
    }

    static async isPresent(provider: MongoProvider, corporationId: number, blueprint: BlueprintDAOModel) {
        return await provider.connection.collection(corporationId.toString() + "_blueprints").find({ "item_id": blueprint.item_id }).count() > 0;
    }
}