import ESI, { Token } from 'eve-esi-client';

export const getCorporationMoonExtractions = async (esi: ESI, token: Token, corporationId: number) => {
    return (await esi.request<Array<MoonExtraction>>(
        `/corporation/${corporationId}/mining/extractions/`,
        null,
        null,
        { token }
    )).json();
}

export interface MoonExtraction {
    chunk_arrival_time:	string //The time at which the chunk being extracted will arrive and can be fractured by the moon mining drill.
    extraction_start_time:	string //The time at which the current extraction was initiated.
    moon_id: number //moon_id integer
    natural_decay_time:	string // The time at which the chunk being extracted will naturally fracture if it is not first fractured by the moon mining drill.
    structure_id: number //structure_id integer
    has_been_notified?: boolean //custom
}
