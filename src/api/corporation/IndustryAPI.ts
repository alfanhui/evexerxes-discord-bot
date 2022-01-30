
import ESI, { Token } from 'eve-esi-client';

export const getCorpIndustry = async (esi: ESI, token: Token, corporationId: number) => {
    return (await esi.request<Array<Industry>>(
        `/corporations/${corporationId}/industry/jobs/`,
        null,
        null,
        { token }
    )).json();
}

export interface Industry {
    activity_id: ActivityIndex //    Job activity ID
    blueprint_id: number //    blueprint_id integer?
    blueprint_location_id: number // Location ID of the location from which the blueprint was installed. Normally a station ID, but can also be an asset (e.g. container) or corporation facility
    blueprint_type_id: number //    blueprint_type_id integer
    completed_character_id?: number //    ID of the character which completed this job
    completed_date?: string //    Date and time when this job was completed
    cost?: number //    The sum of job installation fee and industry facility tax
    duration: number //    Job duration in seconds
    end_date: string //    Date and time when this job finished
    facility_id: number //    ID of the facility where this job is running
    installer_id: number //    ID of the character which installed this job
    job_id: number //    Unique job ID
    licensed_runs?: number //    Number of runs blueprint is licensed for
    location_id: number //    ID of the location for the industry facility
    name?: string //CUSTOM OUTPUT
    output_location_id: number //    Location ID of the location to which the output of the job will be delivered. Normally a station ID, but can also be a corporation facility
    pause_date?: string //    Date and time when this job was paused (i.e. time when the facility where this job was installed went offline)
    probability: number //    Chance of success for invention
    product_type_id?: number //    Type ID of product (manufactured, copied or invented)
    runs: number //    Number of runs for a manufacturing job, or number of copies to make for a blueprint copy
    start_date: string //    Date and time when this job started
    status: IStatus
    successful_runs?: number //    Number of successful runs for this job. Equal to runs unless this is an invention job
}

export enum IStatus {
    active = 'active',
    cancelled = 'cancelled',
    delivered = 'delivered',
    paused = 'paused',
    ready = 'ready',
    reverted = 'reverted'
}

export enum ActivityIndex {
    unknown0,
    manufacturing,
    unknown2,
    researching_time_efficiency,
    researching_material_efficiency,
    copying,
    unknown6,
    reverse_engineering,
    invention,
    unknown9,
    unknown10,
    reactions,
}