import { CorpStructure } from "../../../src/api/corperation/structuresAPI";

export const corpStructure1 = <CorpStructure>JSON.parse('{ \
    "corporation_id": 12345,  \
    "fuel_expires": "2021-07-01 00:00:01", \
    "name": "Lalatte\'s luna lounge", \
    "next_reinforce_apply": "2021-07-01 00:00:01", \
    "next_reinforce_hour": 16, \
    "profile_id": 2000, \
    "reinforce_hour": 20, \
    "services": [{"name": "clone_bay", "state": "online"}], \
    "state": "unknown", \
    "state_timer_end": "", \
    "state_timer_start": "", \
    "structure_id": 1111, \
    "system_id": 2222, \
    "type_id": 0, \
    "unanchors_at": "", \
    "previous_fuel_status": null \
}');

export const corpStructure2 = <CorpStructure>JSON.parse('{ \
    "corporation_id": 12345, \
    "fuel_expires": "2021-07-02 00:00:01", \
    "name": "Raitue", \
    "next_reinforce_apply": null, \
    "next_reinforce_hour": null, \
    "profile_id": 2000, \
    "reinforce_hour": 20, \
    "services": [{"name": "clone_bay", "state": "online"}], \
    "state": "unknown", \
    "state_timer_end": "", \
    "state_timer_start": "", \
    "structure_id": 1112, \
    "system_id": 2222, \
    "type_id": 0, \
    "unanchors_at": "", \
    "previous_fuel_status": null \
}');
