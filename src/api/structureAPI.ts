import ESI, { Token } from 'eve-esi-client';

export const getStructureInfo = async (request: ESI, token: Token, structureId: number) => {
    return (await request.request<Structure>(
        `/universe/structures/${structureId}`,
        null,
        null,
        { token }
    )).json();
}

export interface Structure {
    name: string // The full name of the structure
    owner_id: number // The ID of the corporation who owns this particular structure
    position?: IPosition
    solar_system_id: number // solar_system_id integer
    type_id?: number // type_id integer
}

export interface IPosition {
    x: number
    y: number
    z: number
}