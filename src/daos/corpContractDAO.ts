import { Message } from 'discord.js';
import MongoProvider from 'eve-esi-client-mongo-provider';
import { Contract, IStatus } from '../api/corporation/contractsAPI';

const indexKey: string = "contract_id";
const index:{[key: string]: number} = {"contract_id": 1};

export interface ChannelMessageID {
    channelId: string,
    messageId: string
}

export interface ContractDAOModel {
    contract_id: number, //contract ID
    contract: Contract, //original contract
    channelMessageIDs: ChannelMessageID[] //To react to later
    hasBeenReacted: Boolean;
}

export function serialiseContractDAOModel(contract: Contract, sentMessages: Message[]):ContractDAOModel {
    let contractDAOModel: ContractDAOModel = {} as ContractDAOModel;
    contractDAOModel.contract = contract;
    contractDAOModel.contract_id = contract.contract_id;
    let channelMessageIDs: ChannelMessageID[] = [];
    for(const message of sentMessages){
        let channelMessageID: ChannelMessageID = {} as ChannelMessageID;
        channelMessageID.channelId = message.channel.id;
        channelMessageID.messageId = message.id;
        channelMessageIDs.push(channelMessageID);
    }
    contractDAOModel.channelMessageIDs = channelMessageIDs;
    contractDAOModel.hasBeenReacted = false;
    return contractDAOModel;
}

export class CorpContractQueries {

    static async createCollection(provider: MongoProvider, corporationId: number){
        if((await provider.connection.db.listCollections({name: `${corporationId}_contracts`}).toArray()).length == 0){
            return provider.connection.db.createCollection(`${corporationId}_contracts`);
        }
    }

    static async createIndex(provider: MongoProvider, corporationId: number) {
        await this.createCollection(provider, corporationId);
        if(await this.hasIndex(provider, corporationId)) return Promise.resolve();
        return await provider.connection.collection(corporationId.toString() + "_contracts").createIndex(
            index,
            {
                unique: true
            }
        );
    }
    
    static async hasIndex(provider: MongoProvider, corporationId: number) {
        var indexes: {[key: string]:Array<Array<{[key: string]: number}>>} = (await provider.connection.collection(corporationId.toString() + "_contracts").getIndexes());
        return indexes.hasOwnProperty(`${indexKey}_1`);
    }

    static async getContract(provider: MongoProvider, corporationId: number, contract: Contract): Promise<ContractDAOModel> {
        return await provider.connection.collection(corporationId.toString() + "_contracts").findOne({ "contract_id": contract.contract_id });
    }

    static async getContracts(provider: MongoProvider, corporationId: number): Promise<Array<ContractDAOModel>> {
        return await provider.connection.collection(corporationId.toString() + "_contracts").find().toArray() as Array<ContractDAOModel>;
    }

    static async saveOrUpdateContract(provider: MongoProvider, corporationId: number, contract: ContractDAOModel) {
        return await provider.connection.collection(corporationId.toString() + "_contracts").updateOne({ "contract_id": contract.contract_id }, { $set: contract }, { upsert: true });
    }

    static async removeOldContracts(provider: MongoProvider, corporationId: number, contracts: Array<Contract>) {
        if(contracts == null || contracts.length < 1) return Promise.resolve();
        var filter: Array<number> = contracts.map((item) =>
            item.contract_id
        );
        //find with nor
        let oldContracts: Array<Contract> = await provider.connection.collection(corporationId.toString() + "_contracts").find({
            "contract_id": {
                $nin: filter
            }
        }).toArray();

        //delete contracts that are returned
        this.deleteContracts(provider, corporationId, oldContracts);
    }

    static async deleteAll(provider: MongoProvider, corporationId: number) {
        return await provider.connection.collection(corporationId.toString() + "_contracts").deleteMany({});
    }

    static async deleteContract(provider: MongoProvider, corporationId: number, contract: Contract) {
        if (contract == null) return Promise.resolve();
        return await provider.connection.collection(corporationId.toString() + "_contracts").deleteOne({ "contract_id": contract.contract_id });
    }

    static async deleteContracts(provider: MongoProvider, corporationId: number, contracts: Array<Contract>) {
        if (contracts == null || contracts.length == 0) return Promise.resolve();
        var filter: Array<Object> = contracts.map((item) => { return { "contract_id": item.contract_id } });
        return await provider.connection.collection(corporationId.toString() + "_contracts").deleteMany({ $or: filter });
    }

    static async isPresent(provider: MongoProvider, corporationId: number, contract: Contract) {
        return await provider.connection.collection(corporationId.toString() + "_contracts").find({ "contract_id": contract.contract_id }).count() > 0;
    }

    static async isNotifiable(provider: MongoProvider, corporationId: number, contract: Contract) {
        const foundContract: boolean = await this.isPresent(provider, corporationId, contract);
        if (contract.status.toString() !== IStatus[IStatus.in_progress] && contract.status.toString() !== IStatus[IStatus.outstanding]) {
            return false;
        }else if(foundContract){
            return false;
        }
        return true;
    }

    static isReactable(contract: Contract): Boolean {
        return (contract.status.toString() == IStatus[IStatus.finished] || contract.status.toString() == IStatus[IStatus.finished_contractor] || contract.status.toString() == IStatus[IStatus.finished_issuer]);
    }
}