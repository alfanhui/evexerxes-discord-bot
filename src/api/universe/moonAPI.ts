import ESI, { Token } from 'eve-esi-client';

export const getMoonInfo = async (request: ESI, token: Token, moonId: number) => {
    return (await request.request<Moon>(
        `/universe/moons/${moonId}/`,
        null,
        null,
        { token }
    )).json();
}

export interface Moon {
    moon_id: number //moon_id integer
    name: string //name string
    position: IPosition
    system_id: Number //The solar system this moon is in
}

interface IPosition{
    x: number
    y: number
    z: number
}