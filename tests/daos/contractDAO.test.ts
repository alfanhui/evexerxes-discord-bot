import MongoProvider from 'eve-esi-client-mongo-provider';
import { CorpContract, IStatus, IType } from '../../src/api/corpContractsAPI';
import { ContractQueries } from "../../src/daos/contractDAO";
import { DBManager } from '../utils/db';

var dbman = new DBManager();
var provider: MongoProvider;
const corperationId: number = 12345;
const corpContract: CorpContract = {
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

beforeAll(async () => {
    const url = await dbman.start();
    provider = new MongoProvider(url + "esi", {
        connectionOptions: {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    });
    //Dodgly await for provider to make a connection..
    await new Promise(resolve => setTimeout(resolve, 100));
});

afterEach(async () => {
    await dbman.cleanup();
})

afterAll((done) => {
    dbman.stop(provider);
    done();
});

test('save a contract', async () => {
    await ContractQueries.saveOrUpdateContract(provider, corperationId, corpContract);
    var isSaved: boolean = await ContractQueries.isContractPresent(provider, corperationId, corpContract);
    expect(isSaved).toBe(true);
});