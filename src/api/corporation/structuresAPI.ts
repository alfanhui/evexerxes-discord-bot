import ESI from 'eve-esi-client';
import { Token } from 'eve-esi-client';

export const getCorpStructures = async (esi: ESI, token: Token, corporationId: number) => {
    return (await esi.request<CorpStructure[]>(
        `/corporations/${corporationId}/structures/`,
        null,
        null,
        { token }
    )).json();
}

export interface CorpStructure {
    _id?: string
    corporation_id: number //ID of the corporation that owns the structure
    fuel_expires?: string //Date on which the structure will run out of fuel
    name?: string //The structure name
    next_reinforce_apply?: string //The date and time when the structure’s newly requested reinforcement times(e.g.next_reinforce_hour and next_reinforce_day) will take effect
    next_reinforce_hour?: number //The requested change to reinforce_hour that will take effect at the time shown by next_reinforce_apply
    profile_id: number //The id of the ACL profile for this citadel
    reinforce_hour?: number //The hour of day that determines the four hour window when the structure will randomly exit its reinforcement periods and become vulnerable to attack against its armor and / or hull.The structure will become vulnerable at a random time that is + /- 2 hours centered on the value of this property
    services?: IStructureService[] //Contains a list of service upgrades, and their state
    state: StructureState //state string
    state_timer_end?: string //Date at which the structure will move to it’s next state
    state_timer_start?: string //Date at which the structure entered it’s current state
    structure_id: number //The Item ID of the structure
    system_id: number //The solar system the structure is in
    type_id: number //The type id of the structure
    unanchors_at?: string //Date at which the structure will unanchor
    previous_fuel_status?: FuelNotify //Custom
}

export interface IStructureService {
    name: string //name string
    state: StructureServiceState //state string
}

export enum StructureServiceState {
    online,
    offline,
    cleanup
}

export enum StructureState {
    anchor_vulnerable,
    anchoring,
    armor_reinforce,
    armor_vulnerable,
    deploy_vulnerable,
    fitting_invulnerable,
    hull_reinforce,
    hull_vulnerable,
    online_deprecated,
    onlining_vulnerable,
    shield_vulnerable,
    unanchored,
    unknown
}

export enum FuelNotify {
    SEVEN_DAY_PLUS,
    SEVEN_DAY,
    THREE_DAY,
    ONE_DAY,
    EMPTY,
    NO_CHANGE,
    UNKNOWN
}