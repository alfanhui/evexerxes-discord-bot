
import ESI, { Token } from 'eve-esi-client';

export const getCorperationInfo = async (esi: ESI, token: Token, corporationId: number) => {
    return (await esi.request<Corperation>(
        `/corporations/${corporationId}/`,
        null,
        null,
        { token }
    )).json();
}

export interface Corperation {
    corperation_id?: number //sue me
    alliance_id?: number //ID of the alliance that corporation is a member of, if any
    ceo_id: number //ceo_id integer
    creator_id: number //creator_id integer
    date_founded?: string //date_founded string
    description?: string    //description string
    faction_id?: number //faction_id integer
    home_station_id?: number //home_station_id integer
    member_count: number //member_count integer
    name: string    //the full name of the corporation
    shares?: number    //shares integer
    tax_rate: number //tax_rate number
    ticker: string    //the short name of the corporation
    url?: string    //url string
    war_eligible?: boolean //war_eligible boolean
}

