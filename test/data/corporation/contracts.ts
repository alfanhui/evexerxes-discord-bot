import { Contract } from "../../../src/api/corporation/contractsAPI";
import { ContractDAOModel } from "../../../src/daos/corpContractDAO";


export const corpContract1 = <Contract>JSON.parse('{ \
    "acceptor_id": null, \
    "assignee_id": null, \
    "availability": null, \
    "buyout": 0, \
    "collateral": 0, \
    "contract_id": 10001, \
    "date_accepted": "monday", \
    "date_completed": "tuesday", \
    "date_expired": "wednesday", \
    "date_issued": "sunday", \
    "days_to_complete": 3, \
    "end_location_id": 6969, \
    "for_corporation": false, \
    "issuer_corporation_id": 98176669, \
    "issuer_id": 2115057016, \
    "price": 1000000, \
    "reward": null, \
    "start_location_id": null, \
    "status": "in_progress", \
    "title": "ore", \
    "type": "item_exchange", \
    "volume": 4000 \
}');

export const corpContract2 = <Contract>JSON.parse('{ \
    "acceptor_id": null, \
    "assignee_id": null, \
    "availability": null, \
    "buyout": 0, \
    "collateral": 0, \
    "contract_id": 10002, \
    "date_accepted": "tuesday", \
    "date_completed": "tuesday", \
    "date_expired": "wednesday", \
    "date_issued": "monday", \
    "days_to_complete": 3, \
    "end_location_id": 6969, \
    "for_corporation": false, \
    "issuer_corporation_id": 98176669, \
    "issuer_id": 2115057016, \
    "price": 5000000, \
    "reward": null, \
    "start_location_id": null, \
    "status": "in_progress", \
    "title": "ore", \
    "type": "item_exchange", \
    "volume": 4000 \
}');


export const corpContract3_notNotifiable = <Contract>JSON.parse('{ \
    "acceptor_id": null, \
    "assignee_id": null, \
    "availability": null, \
    "buyout": 0, \
    "collateral": 0, \
    "contract_id": 10003, \
    "date_accepted": "tuesday", \
    "date_completed": "tuesday", \
    "date_expired": "wednesday", \
    "date_issued": "monday", \
    "days_to_complete": 3, \
    "end_location_id": 6969, \
    "for_corporation": false, \
    "issuer_corporation_id": 98176669, \
    "issuer_id": 2115057016, \
    "price": 5000000, \
    "reward": null, \
    "start_location_id": null, \
    "status": "finished", \
    "title": "ore", \
    "type": "item_exchange", \
    "volume": 4000 \
}');