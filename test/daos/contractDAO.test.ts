import MongoProvider from 'eve-esi-client-mongo-provider';
import { cloneDeep } from 'lodash';
import { Contract, IStatus } from '../../src/api/corporation/contractsAPI';
import { ContractDAOModel, CorpContractQueries, serialiseContractDAOModel } from "../../src/daos/corpContractDAO";
import { corpContract1, corpContract2, corpContract3_notNotifiable } from '../data/corporation/contracts';
import { DBManager } from '../utils/db';

var dbman = new DBManager();
var provider: MongoProvider;
const corporationId: number = 12345;

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
    await CorpContractQueries.createIndex(provider, corporationId);
});

afterEach(async () => {
    await provider.connection.collection(`${corporationId}_contracts`).deleteMany({});
})

afterAll(async () => {
    await dbman.stop(provider);
});

test('save a contract', async () => {
    await CorpContractQueries.saveOrUpdateContract(provider, corporationId, serialiseContractDAOModel(corpContract1, []));
    let isSaved: boolean = await CorpContractQueries.isPresent(provider, corporationId, corpContract1);
    expect(isSaved).toBe(true);
});

test('get contracts if expecting nothing', async () => {
    let updatedCorpContract: ContractDAOModel[] = await CorpContractQueries.getContracts(provider, corporationId);
    expect(updatedCorpContract.length).toBe(0);
});

test('get contracts if expecting 1', async () => {
    await CorpContractQueries.saveOrUpdateContract(provider, corporationId, serialiseContractDAOModel(corpContract1, []));
    let updatedCorpContract: ContractDAOModel[] = await CorpContractQueries.getContracts(provider, corporationId);
    expect(updatedCorpContract.length).toBe(1);
});

test('get contracts if expecting 2', async () => {
    await CorpContractQueries.saveOrUpdateContract(provider, corporationId, serialiseContractDAOModel(corpContract1, []));
    await CorpContractQueries.saveOrUpdateContract(provider, corporationId, serialiseContractDAOModel(corpContract2, []));
    let updatedCorpContract: ContractDAOModel[] = await CorpContractQueries.getContracts(provider, corporationId);
    expect(updatedCorpContract.length).toBe(2);
});

test('update an existing contract', async () => {
    await CorpContractQueries.saveOrUpdateContract(provider, corporationId, serialiseContractDAOModel(corpContract1, []));
    const corpContract_1_1: Contract = cloneDeep(corpContract1);
    corpContract_1_1.status = IStatus.finished;
    await CorpContractQueries.saveOrUpdateContract(provider, corporationId, serialiseContractDAOModel(corpContract_1_1, []));
    let count: number = await provider.connection.collection(`${corporationId}_contracts`).find({}).count();
    expect(count).toBe(1);
    let isSaved: boolean = await CorpContractQueries.isPresent(provider, corporationId, corpContract1);
    expect(isSaved).toBe(true);
    let updatedCorpContract: ContractDAOModel = (await CorpContractQueries.getContracts(provider, corporationId))[0];
    expect(updatedCorpContract.contract.status).toBe(IStatus.finished);
});

test('delete contract does nothing if provided with nothing', async () => {
    await CorpContractQueries.saveOrUpdateContract(provider, corporationId, serialiseContractDAOModel(corpContract1, []));
    await CorpContractQueries.deleteContract(provider, corporationId, {} as Contract);
    let updatedCorpContract: ContractDAOModel[] = await CorpContractQueries.getContracts(provider, corporationId);
    expect(updatedCorpContract.length).toBe(1);
});

test('delete contract successfully deletes 1', async () => {
    await CorpContractQueries.saveOrUpdateContract(provider, corporationId, serialiseContractDAOModel(corpContract1, []));
    await CorpContractQueries.deleteContract(provider, corporationId, corpContract1);
    let updatedCorpContract: ContractDAOModel[] = await CorpContractQueries.getContracts(provider, corporationId);
    expect(updatedCorpContract.length).toBe(0);
});

test('delete multiple contracts does nothing if provided with nothing', async () => {
    await CorpContractQueries.saveOrUpdateContract(provider, corporationId, serialiseContractDAOModel(corpContract1, []));
    await CorpContractQueries.deleteContracts(provider, corporationId, []);
    let updatedCorpContract: ContractDAOModel[] = await CorpContractQueries.getContracts(provider, corporationId);
    expect(updatedCorpContract.length).toBe(1);
});

test('delete multiple contracts successfully deletes multiple', async () => {
    await CorpContractQueries.saveOrUpdateContract(provider, corporationId, serialiseContractDAOModel(corpContract1, []));
    await CorpContractQueries.saveOrUpdateContract(provider, corporationId, serialiseContractDAOModel(corpContract2, []));
    await CorpContractQueries.deleteContracts(provider, corporationId, [corpContract1, corpContract2]);
    let updatedCorpContract: ContractDAOModel[] = await CorpContractQueries.getContracts(provider, corporationId);
    expect(updatedCorpContract.length).toBe(0);
});

test('isContractPresent false when given different contract', async () => {
    await CorpContractQueries.saveOrUpdateContract(provider, corporationId, serialiseContractDAOModel(corpContract1, []));
    let isSaved: boolean = await CorpContractQueries.isPresent(provider, corporationId, corpContract2);
    expect(isSaved).toBe(false);
});

test('isNotifiableContract true when given notifiable contract', async () => {
    let isSaved: boolean = await CorpContractQueries.isPresent(provider, corporationId, corpContract1);
    expect(isSaved).toBe(false);
    let isNotifiable: boolean = await CorpContractQueries.isNotifiable(provider, corporationId, corpContract1);
    expect(isNotifiable).toBe(true);
});

test('isNotifiableContract false when given invalid contract', async () => {
    let isNotifiable: boolean = await CorpContractQueries.isNotifiable(provider, corporationId, corpContract3_notNotifiable);
    expect(isNotifiable).toBe(false);
});

test('removeOldContracts successfully removes corpContract1 as it was old', async () => {
    await CorpContractQueries.saveOrUpdateContract(provider, corporationId, serialiseContractDAOModel(corpContract1, []));
    await CorpContractQueries.saveOrUpdateContract(provider, corporationId, serialiseContractDAOModel(corpContract2, []));
    let oldCorpContracts: ContractDAOModel[] = await CorpContractQueries.getContracts(provider, corporationId);
    expect(oldCorpContracts.length).toBe(2);
    let newCorpContracts: Contract[] = [corpContract2, corpContract3_notNotifiable];
    //corpContract3_notNotifiable will not be saved at this time.
    await CorpContractQueries.removeOldContracts(provider, corporationId, newCorpContracts);
    let remainingCorpContracts: ContractDAOModel[] = await CorpContractQueries.getContracts(provider, corporationId);
    expect(remainingCorpContracts.length).toBe(1);
    expect(remainingCorpContracts.pop()?.contract_id).toBe(corpContract2.contract_id);
});

test('removeOldContracts successfully does nothing with same contracts', async () => {
    await CorpContractQueries.saveOrUpdateContract(provider, corporationId, serialiseContractDAOModel(corpContract1, []));
    await CorpContractQueries.saveOrUpdateContract(provider, corporationId, serialiseContractDAOModel(corpContract2, []));
    let oldCorpContracts: ContractDAOModel[] = await CorpContractQueries.getContracts(provider, corporationId);
    expect(oldCorpContracts.length).toBe(2);
    let newCorpContracts: Contract[] = [corpContract1, corpContract2];
    //corpContract3_notNotifiable will not be saved at this time.
    await CorpContractQueries.removeOldContracts(provider, corporationId, newCorpContracts);
    let remainingCorpContracts: ContractDAOModel[] = await CorpContractQueries.getContracts(provider, corporationId);
    expect(remainingCorpContracts.length).toBe(2);
});