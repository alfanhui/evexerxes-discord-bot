import MongoProvider from 'eve-esi-client-mongo-provider';
import { CorpContract, IStatus } from '../api/corpContractsAPI';

export class ContractQueries {
    static async getContracts(provider: MongoProvider, corperationId: number) {
        return await provider.connection.collection(corperationId.toString() + "_contracts").find().toArray() as Array<CorpContract>;
    }

    static async saveOrUpdateContract(provider: MongoProvider, corperationId: number, corpContract: CorpContract) {
        return await provider.connection.collection(corperationId.toString() + "_contracts").updateOne({ "contract_id": corpContract.contract_id }, { $set: corpContract }, { upsert: true });
    }

    static async removeOldContracts(provider: MongoProvider, corperationId: number, corpContracts: Array<CorpContract>) {
        var filter: Array<number> = corpContracts.map((item) =>
            item.contract_id
        );
        //find with nor
        let oldCorpContacts: Array<CorpContract> = await provider.connection.collection(corperationId.toString() + "_contracts").find({
            "contract_id": {
                $nin: filter
            }
        }).toArray();

        //delete contracts that are returned
        this.deleteContracts(provider, corperationId, oldCorpContacts);
    }

    static async deleteContract(provider: MongoProvider, corperationId: number, corpContract: CorpContract) {
        if (!corpContract || corpContract == undefined) return Promise.resolve();
        return await provider.connection.collection(corperationId.toString() + "_contracts").deleteOne({ "contract_id": corpContract.contract_id });
    }

    static async deleteContracts(provider: MongoProvider, corperationId: number, corpContracts: Array<CorpContract>) {
        if (!corpContracts || corpContracts == undefined || corpContracts.length == 0) return Promise.resolve();
        var filter: Array<Object> = corpContracts.map((item) => { return { "contract_id": item.contract_id } });
        return await provider.connection.collection(corperationId.toString() + "_contracts").deleteMany({ $or: filter });
    }

    static async isPresent(provider: MongoProvider, corperationId: number, corpContract: CorpContract) {
        return await provider.connection.collection(corperationId.toString() + "_contracts").find({ "contract_id": corpContract.contract_id }).count() > 0;
    }

    static async isNotifiable(provider: MongoProvider, corperationId: number, corpContract: CorpContract) {
        const foundContract: boolean = await this.isPresent(provider, corperationId, corpContract);
        if (foundContract || (corpContract.status != IStatus.in_progress && corpContract.status != IStatus.outstanding)) {
            return false;
        }
        return true;
    }
}