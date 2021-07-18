import ESI, { Token } from 'eve-esi-client';

export const getPublicCharacterInfo = (request: ESI['request'], token: Token, characterId: number) => {
    return request<CharacterPublic>(
        `/characters/${characterId}`,
        null,
        null,
        { token }
    );
}

export interface CharacterPublic {
    alliance_id: number //     The character’s alliance ID
    ancestry_id: number //     ancestry_id integer
    birthday: string //     Creation date of the character
    bloodline_id: number //     bloodline_id integer
    corporation_id: number //     The character’s corporation ID
    description: string //     description string
    faction_id: number //     ID of the faction the character is fighting for, if the character is enlisted in Factional Warfare
    gender: IGender //     gender string
    name: string //     name string
    race_id: number //     race_id integer
    security_status: number //     security_status number
    title: string // The individual title of the character
}

export enum IGender {
    male, female
}
