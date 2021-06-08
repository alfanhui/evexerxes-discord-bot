import ESI from 'eve-esi-client';
import {Token} from 'eve-esi-client';

export const getCorpContacts = (request: ESI['request'], token: Token, corporation_id:number) =>{
    const endpoint = `/corporations/${corporation_id}/contracts/`;
    return request<CorpContacts[]>(
        endpoint,
        null,
        null,
        { token }
      );
}

interface CorpContacts {
    acceptor_id: number, //Who will accept the contract
    assignee_id: number, //ID to whom the contract is assigned, can be corporation or character ID
    availabilit: string, // To whom the contract is available
    buyout: number, //Buyout price (for Auctions only
    collateral:	number, //Collateral price (for Couriers only)
    contract_id: number,
    date_accepted: string, //Date of confirmation of contract
    date_completed:	string, //Date of completed of contract
    date_expired: string, //Expiration date of the contract
    date_issued: string, //Сreation date of the contract
    days_to_complete: number, //Number of days to perform the contract
    end_location_id: number, //End location ID (for Couriers contract)
    for_corporation: boolean, //true if the contract was issued on behalf of the issuer’s corporation
    issuer_corporation_id: number, //Character’s corporation ID for the issuer
    issuer_id: number, //Character ID for the issuer
    price: number, //Price of contract (for ItemsExchange and Auctions)
    reward:	number, //Remuneration for contract (for Couriers only)
    start_location_id: number, //Start location ID (for Couriers contract)
    status: string, //Status of the the contract
    title:	string, //Title of the contract
    type:	string, //Type of the contract
    volume:	number //Volume of items in the contract
}