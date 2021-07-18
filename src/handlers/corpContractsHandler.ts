import ESI, { Token } from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider';
import { getPublicCharacterInfo } from '../api/characterAPI';
import { CorpContract, getCorpContracts, IStatus } from '../api/corpContractsAPI';

export async function syncCorpContacts(provider: MongoProvider, esi: ESI, characterId: number) {
    //TODO CALL EVE API
    const corperationId: number = await (await (await getPublicCharacterInfo(esi['request'], null, 2118131516)).json()).corporation_id;
    const token: Token = await provider.getToken(characterId, 'esi-contracts.read_corporation_contracts.v1')
    const contracts: CorpContract[] = await (await getCorpContracts(esi['request'], token, corperationId)).json();
    //TODO Compare results with existing
    var body: string;
    for (const contract of contracts) {
        if (contract.assignee_id != corperationId) continue;
        if (contract.status != IStatus.in_progress && contract.status != IStatus.outstanding) continue;
        body += `<li>title:${contract.title},type:${contract.type},price:${contract.price},issuer:${contract.issuer_id}</li>`
    }
    //TODO Post to Discord any notifications
    //TODO Save new results
}