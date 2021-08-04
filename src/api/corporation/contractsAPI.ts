import ESI, { Token } from 'eve-esi-client';

export const getCorpContracts = async(esi: ESI, token: Token, corporationId: number) => {
    return (await esi.request<Array<Contract>>(
        `/corporations/${corporationId}/contracts/`,
        null,
        null,
        { token }
    )).json();
}

export interface Contract {
    acceptor_id: number, //Who will accept the contract
    assignee_id: number, //ID to whom the contract is assigned, can be corporation or character ID
    availability: string, // To whom the contract is available
    buyout?: number, //Buyout price (for Auctions only
    collateral?: number, //Collateral price (for Couriers only)
    contract_id: number, //contract_id integer
    date_accepted?: string, //Date of confirmation of contract
    date_completed?: string, //Date of completed of contract
    date_expired: string, //Expiration date of the contract
    date_issued: string, //Сreation date of the contract
    days_to_complete?: number, //Number of days to perform the contract
    end_location_id?: number, //End location ID (for Couriers contract)
    for_corporation: boolean, //true if the contract was issued on behalf of the issuer’s corporation
    issuer_corporation_id: number, //Character’s corporation ID for the issuer
    issuer_id: number, //Character ID for the issuer
    price?: number, //Price of contract (for ItemsExchange and Auctions)
    reward?: number, //Remuneration for contract (for Couriers only)
    start_location_id?: number, //Start location ID (for Couriers contract)
    status: IStatus, //Status of the the contract
    title?: string, //Title of the contract
    type: IType, //Type of the contract
    volume?: number //Volume of items in the contract
}

export enum IStatus {
    outstanding,
    in_progress,
    finished_issuer,
    finished_contractor,
    finished,
    cancelled,
    rejected,
    failed,
    deleted,
    reversed
}

export enum IType {
    unknown,
    item_exchange,
    auction,
    courier,
    loan
}