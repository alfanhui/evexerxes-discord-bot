import MongoProvider from 'eve-esi-client-mongo-provider';
import { cloneDeep } from 'lodash';
import { CorpStructure } from '../../src/api/corporation/structuresAPI';
import { CorpStructuresQueries, FuelNotify } from '../../src/daos/corpStructuresDAO';
import { corpStructure1, corpStructure2  } from '../data/corporation/structures';
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
    await CorpStructuresQueries.createIndex(provider, corporationId);
});

afterEach(async () => {
    await provider.connection.collection(`${corporationId}_structures`).deleteMany({});
})

afterAll(async () => {
    await dbman.stop(provider);
});

test('save a structure', async () => {
    await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpStructure1);
    let isSaved: boolean = await CorpStructuresQueries.isPresent(provider, corporationId, corpStructure1);
    expect(isSaved).toBe(true);
});

test('get structures, expecting nothing', async () => {
    let structures: CorpStructure[] = await CorpStructuresQueries.getStructures(provider, corporationId);
    expect(structures.length).toBe(0);
});

test('get structures, expecting 1', async () => {
    await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpStructure1);
    let structures: CorpStructure[] = await CorpStructuresQueries.getStructures(provider, corporationId);
    expect(structures.length).toBe(1);
});

test('get structures, expecting 2', async () => {
    await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpStructure1);
    await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpStructure2);
    let structures: CorpStructure[] = await CorpStructuresQueries.getStructures(provider, corporationId);
    expect(structures.length).toBe(2);
});

test('get structure, expecting structure object', async () => {
    await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpStructure1);
    let structure: CorpStructure = await CorpStructuresQueries.getStructure(provider, corporationId, corpStructure1);
    delete structure._id;
    expect(structure).toStrictEqual(corpStructure1);
});

test('update an existing structure', async () => {
    await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpStructure1);
    const corpStructure1_1: CorpStructure = cloneDeep(corpStructure1);
    corpStructure1_1.fuel_expires = '2021-07-03 00:00:01';
    await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpStructure1_1);
    let count: number = await provider.connection.collection(`${corporationId}_structures`).find({}).count();
    expect(count).toBe(1);
    let isSaved: boolean = await CorpStructuresQueries.isPresent(provider, corporationId, corpStructure1);
    expect(isSaved).toBe(true);
    let updatedStructure: CorpStructure = (await CorpStructuresQueries.getStructures(provider, corporationId))[0];
    expect(updatedStructure.fuel_expires).toBe('2021-07-03 00:00:01');
});

// test('delete contract does nothing if provided with nothing', async () => {
//     await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpStructure1);
//     await CorpStructuresQueries.deleteContract(provider, corporationId, null);
//     let updatedCorpContract: Structure[] = await CorpStructuresQueries.getContracts(provider, corporationId);
//     expect(updatedCorpContract.length).toBe(1);
// });

// test('delete contract successfully deletes 1', async () => {
//     await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpStructure1);
//     await CorpStructuresQueries.deleteContract(provider, corporationId, corpStructure1);
//     let updatedCorpContract: Structure[] = await CorpStructuresQueries.getContracts(provider, corporationId);
//     expect(updatedCorpContract.length).toBe(0);
// });

// test('delete multiple contracts does nothing if provided with nothing', async () => {
//     await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpStructure1);
//     await CorpStructuresQueries.deleteContracts(provider, corporationId, null);
//     let updatedCorpContract: Structure[] = await CorpStructuresQueries.getContracts(provider, corporationId);
//     expect(updatedCorpContract.length).toBe(1);
// });

// test('delete multiple contracts successfully deletes multiple', async () => {
//     await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpStructure1);
//     await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpContract_2);
//     await CorpStructuresQueries.deleteContracts(provider, corporationId, [corpStructure1, corpContract_2]);
//     let updatedCorpContract: Structure[] = await CorpStructuresQueries.getContracts(provider, corporationId);
//     expect(updatedCorpContract.length).toBe(0);
// });

test('getFuelNotifyStatus negative days prior on new structure gives empty warning', async () => {
    jest
    .spyOn(global.Date, 'now')
    .mockImplementation(() =>
      new Date(2021, 6, 5).valueOf() //Empty
    );

    const fuelNotify: FuelNotify = await CorpStructuresQueries.getFuelNotifyStatus(provider, corporationId, corpStructure1);
    expect(fuelNotify).toBe(FuelNotify.EMPTY);
});

test('getFuelNotifyStatus 1 days prior on new structure gives 1 days warning', async () => {
    jest
    .spyOn(global.Date, 'now')
    .mockImplementation(() =>
      new Date(2021, 5, 30, 12).valueOf() //Less than one days
    );

    const fuelNotify: FuelNotify = await CorpStructuresQueries.getFuelNotifyStatus(provider, corporationId, corpStructure1);
    expect(fuelNotify).toBe(FuelNotify.ONE_DAY);
});

test('getFuelNotifyStatus 3 days prior on new structure gives 3 days warning', async () => {
    jest
    .spyOn(global.Date, 'now')
    .mockImplementation(() =>
      new Date(2021, 5, 29, 12).valueOf() //Less than three days
    );

    const fuelNotify: FuelNotify = await CorpStructuresQueries.getFuelNotifyStatus(provider, corporationId, corpStructure1);
    expect(fuelNotify).toBe(FuelNotify.THREE_DAY);
});

test('getFuelNotifyStatus 7 days prior on new structure gives 7 days warning', async () => {
    jest
    .spyOn(global.Date, 'now')
    .mockImplementation(() =>
      new Date(2021, 5, 26).valueOf() //more than three days
    );

    const fuelNotify: FuelNotify = await CorpStructuresQueries.getFuelNotifyStatus(provider, corporationId, corpStructure1);
    expect(fuelNotify).toBe(FuelNotify.SEVEN_DAY);
});

test('getFuelNotifyStatus more than 7 days prior on new structure gives 7PLUS days warning', async () => {
    jest
    .spyOn(global.Date, 'now')
    .mockImplementation(() =>
      new Date(2021, 4, 29, 12).valueOf() //more than seven days
    );

    const fuelNotify: FuelNotify = await CorpStructuresQueries.getFuelNotifyStatus(provider, corporationId, corpStructure1);
    expect(fuelNotify).toBe(FuelNotify.SEVEN_DAY_PLUS);
});

test('getFuelNotifyStatus 1 days prior on already notified structure gives NO_CHANGE', async () => {
    
    jest
    .spyOn(global.Date, 'now')
    .mockImplementation(() =>
      new Date(2021, 5, 30, 12).valueOf() //Less than one days
    );
    await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpStructure1);
    const fuelNotify: FuelNotify = await CorpStructuresQueries.getFuelNotifyStatus(provider, corporationId, corpStructure1);
    expect(fuelNotify).toBe(FuelNotify.NO_CHANGE);
});

interface Test {
    a?: string
    b?: string
}

test('test', ()=>{
    var objectA: Test = {"a": "a"};
    var objectB: Test = {"b": "a"};
    if(objectA?.a == objectB?.a){
        fail();
    }
    if(objectA?.b == objectB?.b){
        fail();
    }
    if(objectA?.a == objectB?.b){
        expect(objectA.a).toBe(objectB.b);
    }else{
        fail();
    }
})

function fail(){
    expect(true).toBe(false);
}


// test('isNotifiableContract true when given notifiable contract', async () => {
//     let isSaved: boolean = await CorpStructuresQueries.isPresent(provider, corporationId, corpStructure1);
//     expect(isSaved).toBe(false);
//     let isNotifiable: boolean = await CorpStructuresQueries.isNotifiable(provider, corporationId, corpStructure1);
//     expect(isNotifiable).toBe(true);
// });

// test('isNotifiableContract false when given invalid contract', async () => {
//     let isNotifiable: boolean = await CorpStructuresQueries.isNotifiable(provider, corporationId, corpContract_3_not_notifiable);
//     expect(isNotifiable).toBe(false);
// });

// test('removeOldContracts successfully removes corpStructure1 as it was old', async () => {
//     await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpStructure1);
//     await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpContract_2);
//     let oldCorpContracts: Structure[] = await CorpStructuresQueries.getContracts(provider, corporationId);
//     expect(oldCorpContracts.length).toBe(2);
//     let newCorpContracts: Structure[] = [corpContract_2, corpContract_3_not_notifiable];
//     //corpContract_3_not_notifiable will not be saved at this time.
//     await CorpStructuresQueries.removeOldContracts(provider, corporationId, newCorpContracts);
//     let remainingCorpContracts: Structure[] = await CorpStructuresQueries.getContracts(provider, corporationId);
//     expect(remainingCorpContracts.length).toBe(1);
//     expect(remainingCorpContracts.pop().contract_id).toBe(corpContract_2.contract_id);
// });

// test('removeOldContracts successfully does nothing with same contracts', async () => {
//     await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpStructure1);
//     await CorpStructuresQueries.saveOrUpdateStructure(provider, corporationId, corpContract_2);
//     let oldCorpContracts: Structure[] = await CorpStructuresQueries.getContracts(provider, corporationId);
//     expect(oldCorpContracts.length).toBe(2);
//     let newCorpContracts: Structure[] = [corpStructure1, corpContract_2];
//     //corpContract_3_not_notifiable will not be saved at this time.
//     await CorpStructuresQueries.removeOldContracts(provider, corporationId, newCorpContracts);
//     let remainingCorpContracts: Structure[] = await CorpStructuresQueries.getContracts(provider, corporationId);
//     expect(remainingCorpContracts.length).toBe(2);
// });