
import ESI, { Token } from 'eve-esi-client';

export const getAllianceInfo = async (esi: ESI, token: Token, allianceId: number) => {
    return (await esi.request<Alliance>(
        `/alliances/${allianceId}/`,
        null,
        null,
        { token }
    )).json();
}

export interface Alliance {
    creator_corporation_id: number //ID of the corporation that created the alliance
    creator_id: number //ID of the character that created the alliance
    date_founded:	string // date_founded string
    executor_corporation_id?: number // the executor corporation ID, if this alliance is not closed
    faction_id?: number // Faction ID this alliance is fighting for, if this alliance is enlisted in factional warfare
    name:	string //the full name of the alliance
    ticker:	string //the short name of the alliance
}

