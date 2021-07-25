import { Structure, StructureState, StructureServiceState } from "../../../src/api/corperation/structuresAPI";

export const corpStructure1: Structure = {
    corporation_id: 12345, //ID of the corporation that owns the structure
    fuel_expires: '2021-07-01 00:00:01', //Date on which the structure will run out of fuel
    name: "Lalatte's luna lounge", //The structure name
    next_reinforce_apply: '2021-07-01 00:00:01', //The date and time when the structure’s newly requested reinforcement times(e.g.next_reinforce_hour and next_reinforce_day) will take effect
    next_reinforce_hour: 16, //The requested change to reinforce_hour that will take effect at the time shown by next_reinforce_apply
    profile_id: 2000, //The id of the ACL profile for this citadel
    reinforce_hour: 20, //The hour of day that determines the four hour window when the structure will randomly exit its reinforcement periods and become vulnerable to attack against its armor and / or hull.The structure will become vulnerable at a random time that is + /- 2 hours centered on the value of this property
    services: [{name: 'clone_bay', state: StructureServiceState.online}], //Contains a list of service upgrades, and their state
    state: StructureState.unknown, //state string
    state_timer_end: '', //Date at which the structure will move to it’s next state
    state_timer_start: '', //Date at which the structure entered it’s current state
    structure_id: 1111, //The Item ID of the structure
    system_id: 2222, //The solar system the structure is in
    type_id: 0, //The type id of the structure
    unanchors_at: '', //Date at which the structure will unanchor
    previous_fuel_status: null
}

export const corpStructure2: Structure = {
    corporation_id: 12345, //ID of the corporation that owns the structure
    fuel_expires: '2021-07-02 00:00:01', //Date on which the structure will run out of fuel
    name: "Raitue", //The structure name
    next_reinforce_apply: null, //The date and time when the structure’s newly requested reinforcement times(e.g.next_reinforce_hour and next_reinforce_day) will take effect
    next_reinforce_hour: null, //The requested change to reinforce_hour that will take effect at the time shown by next_reinforce_apply
    profile_id: 2000, //The id of the ACL profile for this citadel
    reinforce_hour: 20, //The hour of day that determines the four hour window when the structure will randomly exit its reinforcement periods and become vulnerable to attack against its armor and / or hull.The structure will become vulnerable at a random time that is + /- 2 hours centered on the value of this property
    services: [{name: 'clone_bay', state: StructureServiceState.online}], //Contains a list of service upgrades, and their state
    state: StructureState.unknown, //state string
    state_timer_end: '', //Date at which the structure will move to it’s next state
    state_timer_start: '', //Date at which the structure entered it’s current state
    structure_id: 1112, //The Item ID of the structure
    system_id: 2222, //The solar system the structure is in
    type_id: 0, //The type id of the structure
    unanchors_at: '', //Date at which the structure will unanchor
    previous_fuel_status: null
}
