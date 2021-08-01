import MongoProvider from 'eve-esi-client-mongo-provider';
import { Contract, IStatus } from '../api/corperation/contractsAPI';

const indexKey: string = "contract_id";
const index:{[key: string]: number} = {"contract_id": 1};

export class CorpContractQueries {

    static async createCollection(provider: MongoProvider, corperationId: number){
        return provider.connection.db.createCollection(`${corperationId}_contracts`);
    }

    static async createIndex(provider: MongoProvider, corperationId: number) {
        await this.createCollection(provider, corperationId);
        if(await this.hasIndex(provider, corperationId)) return Promise.resolve();
        return await provider.connection.collection(corperationId.toString() + "_contracts").createIndex(
            index,
            {
                unique: true
            }
        );
    }
    
    static async hasIndex(provider: MongoProvider, corperationId: number) {
        var indexes: {[key: string]:Array<Array<{[key: string]: number}>>} = (await provider.connection.collection(corperationId.toString() + "_contracts").getIndexes());
        return indexes.hasOwnProperty(`${indexKey}_1`);
    }

    static async getContracts(provider: MongoProvider, corperationId: number) {
        return await provider.connection.collection(corperationId.toString() + "_contracts").find().toArray() as Array<Contract>;
    }

    static async saveOrUpdateContract(provider: MongoProvider, corperationId: number, contract: Contract) {
        return await provider.connection.collection(corperationId.toString() + "_contracts").updateOne({ "contract_id": contract.contract_id }, { $set: contract }, { upsert: true });
    }

    static async removeOldContracts(provider: MongoProvider, corperationId: number, contracts: Array<Contract>) {
        var filter: Array<number> = contracts.map((item) =>
            item.contract_id
        );
        //find with nor
        let oldContracts: Array<Contract> = await provider.connection.collection(corperationId.toString() + "_contracts").find({
            "contract_id": {
                $nin: filter
            }
        }).toArray();

        //delete contracts that are returned
        this.deleteContracts(provider, corperationId, oldContracts);
    }

    static async deleteAll(provider: MongoProvider, corperationId: number) {
        return await provider.connection.collection(corperationId.toString() + "_contracts").deleteMany({});
    }

    static async deleteContract(provider: MongoProvider, corperationId: number, contract: Contract) {
        if (!contract || contract == undefined) return Promise.resolve();
        return await provider.connection.collection(corperationId.toString() + "_contracts").deleteOne({ "contract_id": contract.contract_id });
    }

    static async deleteContracts(provider: MongoProvider, corperationId: number, contracts: Array<Contract>) {
        if (!contracts || contracts == undefined || contracts.length == 0) return Promise.resolve();
        var filter: Array<Object> = contracts.map((item) => { return { "contract_id": item.contract_id } });
        return await provider.connection.collection(corperationId.toString() + "_contracts").deleteMany({ $or: filter });
    }

    static async isPresent(provider: MongoProvider, corperationId: number, contract: Contract) {
        return await provider.connection.collection(corperationId.toString() + "_contracts").find({ "contract_id": contract.contract_id }).count() > 0;
    }

    static async isNotifiable(provider: MongoProvider, corperationId: number, contract: Contract) {
        const foundContract: boolean = await this.isPresent(provider, corperationId, contract);
        if ((contract.status.toString() !== IStatus[IStatus.in_progress] && contract.status.toString() !== IStatus[IStatus.outstanding])) {
            return false;
        }else if(foundContract){
            return false;
        }
        return true;
    }
}