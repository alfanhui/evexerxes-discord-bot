import ESI, { Token } from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider';
import { getPublicCharacterInfo } from '../api/characterAPI';
import { CorpContract, getCorpContracts, IStatus } from '../api/corpContractsAPI';
import { ContractQueries } from "../daos/contractDAO";

export async function syncCorpContacts(provider: MongoProvider, esi: ESI, characterId: number) {
    //Request update from Eve API
    const corperationId: number = (await (await getPublicCharacterInfo(esi['request'], null, 2118131516)).json()).corporation_id;
    const token: Token = await provider.getToken(characterId, 'esi-contracts.read_corporation_contracts.v1')
    const contracts: CorpContract[] = await (await getCorpContracts(esi['request'], token, corperationId)).json();

    //Remove any contacts that aren't in the original request.
    ContractQueries.removeOldContracts(provider, corperationId, contracts);

    for (const contract of contracts) {
        //Compare results with existing
        if (contract.assignee_id != corperationId) continue;
        if (!ContractQueries.isNotifiable(provider, corperationId, contract)) continue;
        //TODO Post to Discord any notifications
        //Save new results
        ContractQueries.saveOrUpdateContract(provider, corperationId, contract);
    }
}