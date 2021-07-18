import MongoProvider from 'eve-esi-client-mongo-provider';
import { CorpContract } from '../api/corpContractsAPI';

export class ContractQueries {
    static async getContracts(provider: MongoProvider, corperationId: number) {
        var response = provider.connection.collection(corperationId.toString() + "_contracts").find();
        let corpContacts: Array<CorpContract> = new Array();
        await response.forEach((item) => {
            corpContacts.push(item);
        });
        return corpContacts;
    }

    static async saveContact(provider: MongoProvider, corperationId: number, corpContract: CorpContract) {
        //Only insert if not present in DB already
        if (!this.isContractPresent(provider, corperationId, corpContract)) {
            return await provider.connection.collection(corperationId.toString() + "_contracts").insertOne(corpContract)
        } else {
            return null;
        }
    }

    static async updateContract(provider: MongoProvider, corperationId: number, corpContract: CorpContract) {
        return await provider.connection.collection(corperationId.toString() + "_contracts").updateOne({ "contract_id": corpContract.contract_id }, corpContract)
    }

    static async isContractPresent(provider: MongoProvider, corperationId: number, corpContract: CorpContract) {
        var foundContract = provider.connection.collection(corperationId.toString() + "_contracts").find({ "contract_id": corpContract.contract_id }).read();
        if (foundContract) {
            return true;
        }
        return false;
    }

    static async isNotifiableContract(provider: MongoProvider, corperationId: number, corpContract: CorpContract) {
        var foundContract = provider.connection.collection(corperationId.toString() + "_contracts").find({ "contract_id": corpContract.contract_id }).read();
        if (foundContract) {
            return false;
        }
        return true;
    }
}