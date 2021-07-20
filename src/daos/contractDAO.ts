import MongoProvider from 'eve-esi-client-mongo-provider';
import { CorpContract, IStatus } from '../api/corpContractsAPI';

export class ContractQueries {
    static async getContracts(provider: MongoProvider, corperationId: number) {
        var response = provider.connection.collection(corperationId.toString() + "_contracts").find();
        let corpContacts: Array<CorpContract> = new Array();
        await response.forEach((item) => {
            corpContacts.push(item);
        });
        return corpContacts;
    }

    static async saveOrUpdateContract(provider: MongoProvider, corperationId: number, corpContract: CorpContract) {
        return await provider.connection.collection(corperationId.toString() + "_contracts").updateOne({ "contract_id": corpContract.contract_id }, { $set: corpContract }, { upsert: true });
    }

    static async reduceContracts(provider: MongoProvider, corperationId: number, corpContracts: Array<CorpContract>) {
        var filter: Array<Object> = new Array();
        corpContracts.forEach((item) =>
            filter.push({ "contract_id": item.contract_id })
        );
        //find with nor
        console.log(filter.toLocaleString());
        var response = provider.connection.collection(corperationId.toString() + "_contracts").find({
            "$not": [
                filter.toLocaleString()
            ]
        });
        let removeCorpContacts: Array<CorpContract> = new Array();
        await response.forEach((item) => {
            removeCorpContacts.push(item);
        });
        //delete contracts that are returned
        this.deleteContracts(provider, corperationId, removeCorpContacts);
    }

    static async deleteContract(provider: MongoProvider, corperationId: number, corpContract: CorpContract) {
        return await provider.connection.collection(corperationId.toString() + "_contracts").deleteOne({ "contract_id": corpContract.contract_id });
    }

    static async deleteContracts(provider: MongoProvider, corperationId: number, corpContracts: Array<CorpContract>) {
        var filter: Array<Object> = new Array();
        corpContracts.forEach((item) =>
            filter.push({ "contract_id": item.contract_id })
        );
        return await provider.connection.collection(corperationId.toString() + "_contracts").deleteMany({ $or: filter });
    }

    static async isPresent(provider: MongoProvider, corperationId: number, corpContract: CorpContract) {
        return await provider.connection.collection(corperationId.toString() + "_contracts").find({ "contract_id": corpContract.contract_id }).count() == 1;
    }

    static async isNotifiable(provider: MongoProvider, corperationId: number, corpContract: CorpContract) {
        const foundContract: boolean = await this.isPresent(provider, corperationId, corpContract);
        if (foundContract || (corpContract.status != IStatus.in_progress && corpContract.status != IStatus.outstanding)) {
            return false;
        }
        return true;
    }
}