import { CorpContract, IStatus, IType } from "../../src/api/corpContractsAPI";

export const corpContract_1: CorpContract = {
    acceptor_id: null,
    assignee_id: null,
    availability: null,
    buyout: 0,
    collateral: 0,
    contract_id: 12345,
    date_accepted: "monday",
    date_completed: "tuesday",
    date_expired: "wednesday",
    date_issued: "sunday",
    days_to_complete: 3,
    end_location_id: 6969,
    for_corporation: false,
    issuer_corporation_id: 98176669,
    issuer_id: 2115057016,
    price: 1000000,
    reward: null,
    start_location_id: null,
    status: IStatus.in_progress,
    title: "ore",
    type: IType.item_exchange,
    volume: 5000
}

export const corpContract_2: CorpContract = {
    acceptor_id: null,
    assignee_id: null,
    availability: null,
    buyout: 0,
    collateral: 0,
    contract_id: 23456,
    date_accepted: "tuesday",
    date_completed: "tuesday",
    date_expired: "wednesday",
    date_issued: "monday",
    days_to_complete: 3,
    end_location_id: 6969,
    for_corporation: false,
    issuer_corporation_id: 98176669,
    issuer_id: 2115057016,
    price: 5000000,
    reward: null,
    start_location_id: null,
    status: IStatus.in_progress,
    title: "ore",
    type: IType.item_exchange,
    volume: 4000
}

export const corpContract_3_not_notifiable: CorpContract = {
    acceptor_id: null,
    assignee_id: null,
    availability: null,
    buyout: 0,
    collateral: 0,
    contract_id: 23456,
    date_accepted: "tuesday",
    date_completed: "tuesday",
    date_expired: "wednesday",
    date_issued: "monday",
    days_to_complete: 3,
    end_location_id: 6969,
    for_corporation: false,
    issuer_corporation_id: 98176669,
    issuer_id: 2115057016,
    price: 5000000,
    reward: null,
    start_location_id: null,
    status: IStatus.finished,
    title: "ore",
    type: IType.item_exchange,
    volume: 4000
}