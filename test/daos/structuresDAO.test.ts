import MongoProvider from 'eve-esi-client-mongo-provider';
import { cloneDeep } from 'lodash';
import { Structure } from '../../src/api/corperation/structuresAPI';
import { StructuresQueries } from '../../src/daos/structuresDAO';
import { corpStructure1, corpStructure2  } from '../data/corperation/structures';
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
    await StructuresQueries.createIndex(provider, corperationId);
});

afterEach(async () => {
    await provider.connection.collection(`${corperationId}_structures`).deleteMany({});
})

afterAll(async () => {
    await dbman.stop(provider);
});

test('save a structure', async () => {
    await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpStructure1);
    let isSaved: boolean = await StructuresQueries.isPresent(provider, corperationId, corpStructure1);
    expect(isSaved).toBe(true);
});

test('get structures, expecting nothing', async () => {
    let corpStructures: Structure[] = await StructuresQueries.getStructures(provider, corperationId);
    expect(corpStructures.length).toBe(0);
});

test('get structures, expecting 1', async () => {
    await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpStructure1);
    let corpStructures: Structure[] = await StructuresQueries.getStructures(provider, corperationId);
    expect(corpStructures.length).toBe(1);
});

test('get structures, expecting 2', async () => {
    await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpStructure1);
    await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpStructure2);
    let updatedCorpContract: Structure[] = await StructuresQueries.getStructures(provider, corperationId);
    expect(updatedCorpContract.length).toBe(2);
});

test('get structure, expecting structure object', async () => {
    await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpStructure1);
    let foundCorpStructure: Structure = await StructuresQueries.getStructure(provider, corperationId, corpStructure1);
    delete foundCorpStructure._id;
    expect(foundCorpStructure).toStrictEqual(corpStructure1);
});

// test('update an existing contract', async () => {
//     await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpStructure1);
//     const corpContract_1_1: Structure = cloneDeep(corpStructure1);
//     corpContract_1_1.status = IStatus.finished;
//     await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpContract_1_1);
//     let count: number = await provider.connection.collection(`${corperationId}_contracts`).find({}).count();
//     expect(count).toBe(1);
//     let isSaved: boolean = await StructuresQueries.isPresent(provider, corperationId, corpStructure1);
//     expect(isSaved).toBe(true);
//     let updatedCorpContract: CorpContract = (await StructuresQueries.getContracts(provider, corperationId))[0];
//     expect(updatedCorpContract.status).toBe(IStatus.finished);
// });

// test('delete contract does nothing if provided with nothing', async () => {
//     await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpStructure1);
//     await StructuresQueries.deleteContract(provider, corperationId, null);
//     let updatedCorpContract: Structure[] = await StructuresQueries.getContracts(provider, corperationId);
//     expect(updatedCorpContract.length).toBe(1);
// });

// test('delete contract successfully deletes 1', async () => {
//     await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpStructure1);
//     await StructuresQueries.deleteContract(provider, corperationId, corpStructure1);
//     let updatedCorpContract: Structure[] = await StructuresQueries.getContracts(provider, corperationId);
//     expect(updatedCorpContract.length).toBe(0);
// });

// test('delete multiple contracts does nothing if provided with nothing', async () => {
//     await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpStructure1);
//     await StructuresQueries.deleteContracts(provider, corperationId, null);
//     let updatedCorpContract: Structure[] = await StructuresQueries.getContracts(provider, corperationId);
//     expect(updatedCorpContract.length).toBe(1);
// });

// test('delete multiple contracts successfully deletes multiple', async () => {
//     await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpStructure1);
//     await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpContract_2);
//     await StructuresQueries.deleteContracts(provider, corperationId, [corpStructure1, corpContract_2]);
//     let updatedCorpContract: Structure[] = await StructuresQueries.getContracts(provider, corperationId);
//     expect(updatedCorpContract.length).toBe(0);
// });

// test('isContractPresent false when given different contract', async () => {
//     await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpStructure1);
//     let isSaved: boolean = await StructuresQueries.isPresent(provider, corperationId, corpContract_2);
//     expect(isSaved).toBe(false);
// });

// test('isNotifiableContract true when given notifiable contract', async () => {
//     let isSaved: boolean = await StructuresQueries.isPresent(provider, corperationId, corpStructure1);
//     expect(isSaved).toBe(false);
//     let isNotifiable: boolean = await StructuresQueries.isNotifiable(provider, corperationId, corpStructure1);
//     expect(isNotifiable).toBe(true);
// });

// test('isNotifiableContract false when given invalid contract', async () => {
//     let isNotifiable: boolean = await StructuresQueries.isNotifiable(provider, corperationId, corpContract_3_not_notifiable);
//     expect(isNotifiable).toBe(false);
// });

// test('removeOldContracts successfully removes corpStructure1 as it was old', async () => {
//     await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpStructure1);
//     await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpContract_2);
//     let oldCorpContracts: Structure[] = await StructuresQueries.getContracts(provider, corperationId);
//     expect(oldCorpContracts.length).toBe(2);
//     let newCorpContracts: Structure[] = [corpContract_2, corpContract_3_not_notifiable];
//     //corpContract_3_not_notifiable will not be saved at this time.
//     await StructuresQueries.removeOldContracts(provider, corperationId, newCorpContracts);
//     let remainingCorpContracts: Structure[] = await StructuresQueries.getContracts(provider, corperationId);
//     expect(remainingCorpContracts.length).toBe(1);
//     expect(remainingCorpContracts.pop().contract_id).toBe(corpContract_2.contract_id);
// });

// test('removeOldContracts successfully does nothing with same contracts', async () => {
//     await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpStructure1);
//     await StructuresQueries.saveOrUpdateStructure(provider, corperationId, corpContract_2);
//     let oldCorpContracts: Structure[] = await StructuresQueries.getContracts(provider, corperationId);
//     expect(oldCorpContracts.length).toBe(2);
//     let newCorpContracts: Structure[] = [corpStructure1, corpContract_2];
//     //corpContract_3_not_notifiable will not be saved at this time.
//     await StructuresQueries.removeOldContracts(provider, corperationId, newCorpContracts);
//     let remainingCorpContracts: Structure[] = await StructuresQueries.getContracts(provider, corperationId);
//     expect(remainingCorpContracts.length).toBe(2);
// });