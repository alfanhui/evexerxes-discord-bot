import ESI, { Token } from 'eve-esi-client';

export const getStationInfo = async (request: ESI, token: Token, stationId: number) => {
    return (await request.request<Station>(
        `/universe/stations/${stationId}`,
        null,
        null,
        { token }
    )).json();
}

export interface Station {
    max_dockable_ship_volume: number //max_dockable_ship_volume number
    name: string // name string
    office_rental_cost:	number //office_rental_cost number
    owner?: number //ID of the corporation that controls this station
    position: IPosition
    race_id?: number //race_id integer
    reprocessing_efficiency: number //reprocessing_efficiency number
    reprocessing_stations_take:	number //reprocessing_stations_take number
    services: Array<string>
    station_id: number //station_id integer
    system_id: number // The solar system this station is in
    type_id: number //type_id integer
}

export interface IPosition{
    x: number
    y: number
    z: number
}