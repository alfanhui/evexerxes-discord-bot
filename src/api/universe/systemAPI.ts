import ESI, { Token } from 'eve-esi-client';

export const getSystemInfo = async (request: ESI, token: Token, systemId: number) => {
    return (await request.request<System>(
        `/universe/systems/${systemId}`,
        null,
        null,
        { token }
    )).json();
}

export interface System {
    constellation_id: number,	//The constellation this solar system is in
    name: string, // name string
    planets?: IPlanets,
    position: IPosition,
    security_class?: string, // security_class string
    security_status: number, //security_status number
    star_id?: number, //star_id integer
    stargates?: number[], //stargates array
    stations?: number[], // stations array
    system_id: number[] //system_id integer
}

export interface IPlanets {
    asteroid_belts?: number[]
    moons?: number[]
    planet_id: number
}

export interface IPosition {
    x: number
    y: number
    z: number
}