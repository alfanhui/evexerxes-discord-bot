import MongoProvider from 'eve-esi-client-mongo-provider';
import { cloneDeep } from 'lodash';
import { CorpContract, IStatus } from '../../src/api/corpContractsAPI';
import { ContractQueries } from "../../src/daos/contractDAO";
import { corpContract_1, corpContract_2, corpContract_3_not_notifiable } from '../data/contracts';
import { DBManager } from '../utils/db';

var dbman = new DBManager();
var provider: MongoProvider;
const corperationId: number = 12345;

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
    await provider.connection.collection(`${corperationId}_contracts`).deleteMany({});
})

afterAll(async () => {
    await dbman.stop(provider);
});

test('save a contract', async () => {
    await ContractQueries.saveOrUpdateContract(provider, corperationId, corpContract_1);
    var isSaved: boolean = await ContractQueries.isPresent(provider, corperationId, corpContract_1);
    expect(isSaved).toBe(true);
});

test('update an existing contract', async () => {
    await ContractQueries.saveOrUpdateContract(provider, corperationId, corpContract_1);
    const corpContract_1_1: CorpContract = cloneDeep(corpContract_1);
    corpContract_1_1.status = IStatus.finished;
    await ContractQueries.saveOrUpdateContract(provider, corperationId, corpContract_1_1);
    var count: number = await provider.connection.collection(`${corperationId}_contracts`).find({}).count();
    expect(count).toBe(1);
    var isSaved: boolean = await ContractQueries.isPresent(provider, corperationId, corpContract_1);
    expect(isSaved).toBe(true);
    var updatedCorpContract: CorpContract = (await ContractQueries.getContracts(provider, corperationId))[0];
    expect(updatedCorpContract.status).toBe(IStatus.finished);
});

test('isContractPresent false when given different contract', async () => {
    await ContractQueries.saveOrUpdateContract(provider, corperationId, corpContract_1);
    var isSaved: boolean = await ContractQueries.isPresent(provider, corperationId, corpContract_2);
    expect(isSaved).toBe(false);
});

test('isNotifiableContract true when given notifiable contract', async () => {
    var isSaved: boolean = await ContractQueries.isPresent(provider, corperationId, corpContract_1);
    expect(isSaved).toBe(false);
    var isNotifiable: boolean = await ContractQueries.isNotifiable(provider, corperationId, corpContract_1);
    expect(isNotifiable).toBe(true);
});

test('isNotifiableContract false when given invalid contract', async () => {
    var isNotifiable: boolean = await ContractQueries.isNotifiable(provider, corperationId, corpContract_3_not_notifiable);
    expect(isNotifiable).toBe(false);
});