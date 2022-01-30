import ESI, { Token } from 'eve-esi-client';

export const getTypeInfo = async (request: ESI, token: Token, typeId: number) => {
    return (await request.request<Type>(
        `/universe/types/${typeId}`,
        null,
        null,
        { token }
    )).json();
}

export interface Type {
    capacity?:	number // capacity number
    description: string // description
    dogma_attributes?: 	IDogmaAttributes[] //dogma_attributes array
    dogma_effects?: 	IDogmaEffects[] //dogma_effects array
    graphic_id?: number // graphic_id 
    group_id: number //group_id
    icon_id?: number // icon_id
    market_group_id?: number // This only exists for types that can be put on the market
    mass?: number // mass number
    name:	string // name
    packaged_volume?: number	//packaged_volume
    portion_size?: number	// portion_size
    published:	boolean //published 
    radius?: number //radius 
    type_id: number //type_id
    volume?:	number //volume
}

export interface IDogmaAttributes {
    attribute_id: number
    value: number
}

export interface IDogmaEffects {
    effect_id: number
    is_default: boolean
}