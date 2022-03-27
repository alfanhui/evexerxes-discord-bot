import ESI, { Token } from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider';
import { Corporation } from '../api/corporation/corporationAPI';
import { getCorpIndustry, Industry } from '../api/corporation/IndustryAPI';
import { BlueprintDAOModel, CorpBlueprintDAOModelQueries, serialiseBlueprintDAOModel, updateBlueprintDAOModel } from '../daos/corpBlueprintsDAO';
import { Blueprint, getCorpBlueprints } from '../api/corporation/blueprintsAPI';
import { getTypeInfo, Type } from '../api/universe/typeAPI';


//This purely tallies industry jobs regularly. See syncCorpIndustryNotifierHandler for actual discord messager
export async function syncCorpIndustry(provider: MongoProvider, esi: ESI, characterId: number, corporation: Corporation): Promise<void> {
    try {
        //Request update from Eve API
        const token_industry: Token = await provider.getToken(characterId, 'esi-industry.read_corporation_jobs.v1')
        var industries: Array<Industry> = await getCorpIndustry(esi, token_industry, corporation.corporation_id);

        const token_blueprint: Token = await provider.getToken(characterId, 'esi-corporations.read_blueprints.v1')
        const blueprints: Array<Blueprint> = await getCorpBlueprints(esi, token_blueprint, corporation.corporation_id);
        var blueprintsSet: Map<number, Blueprint> = new Map(blueprints.map(obj => [obj.item_id, obj]));

        for (const industry of industries) {
            //Attempt to get this blueprint from database
            let blueprintDAOModel: BlueprintDAOModel = await CorpBlueprintDAOModelQueries.getBlueprintDAOModel(provider, corporation.corporation_id, industry.blueprint_id);

            //If it doesn't exist, call types API
            if (!blueprintDAOModel){
                var type: Type = await getTypeInfo(esi, null, industry.blueprint_type_id);
                var blueprint = blueprintsSet.get(industry.blueprint_id); //blueprints update their values before delivery.
                blueprintDAOModel = serialiseBlueprintDAOModel(blueprint, industry, type);
            } else {
                blueprintDAOModel = updateBlueprintDAOModel(blueprintDAOModel, industry);
            }
            CorpBlueprintDAOModelQueries.saveOrUpdateBlueprintDAOModel(provider, corporation.corporation_id, blueprintDAOModel);
        }
    } catch (e) {
        console.error(`IndustryScheduler failed for ${corporation.name}`)
        console.error(e)
        return null;
    } finally{
        console.log(`IndustryScheduler finished for ${corporation.name}`)
    }
}