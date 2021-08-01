import ESI, { Token } from 'eve-esi-client';

export const getWars = async (esi: ESI, token: Token) => {
    return (await esi.request<Array<number>>(
        `/wars/`,
        null,
        null,
        { token }
    )).json();
}

export const getWar = async (esi: ESI, token: Token, warId: number) => {
    return (await esi.request<War>(
        `/wars/${warId}`,
        null,
        null,
        { token }
    )).json();
}


export interface War {
    aggressor: Aggressor,
    allies: Ally[],
    declared: string, //Time that the war was declared
    defender: Defender,
    finished: string, //Time the war ended and shooting was no longer allowed
    id: number, //ID of the specified war
    mutual: boolean, //Was the war declared mutual by both parties
    open_for_allies: boolean, //Is the war currently open for allies or not
    retracted?: string, //Time the war was retracted but both sides could still shoot each other
    started?: string //Time when the war started and both sides could shoot each other
}

export interface Aggressor {
    alliance_id?: number //Alliance ID if and only if the aggressor is an alliance
    corporation_id?: number //Corporation ID if and only if the aggressor is a corporation
    isk_destroyed: number //ISK value of ships the aggressor has destroyed
    ships_killed: number //The number of ships the aggressor has killed
}

export interface Ally {
    alliance_id?: number //Alliance ID if and only if this ally is an alliance
    corporation_id?: number //Corporation ID if and only if this ally is a corporation
}

export interface Defender {
    alliance_id?: number //Alliance ID if and only if the defender is an alliance
    corporation_id?: number //Corporation ID if and only if the defender is a corporation
    isk_destroyed: number //ISK value of ships the defender has killed
    ships_killed: number //The number of ships the defender has killed
}