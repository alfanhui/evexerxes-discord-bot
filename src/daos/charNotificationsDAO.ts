import MongoProvider from 'eve-esi-client-mongo-provider';
import { CharNotification, SenderType , Type} from '../api/character/notificationsAPI';

const indexKey: string = "notification_id";
const index:{[key: string]: number} = {"notification_id": 1};

export class CharNotificationsQueries {

    static async createCollection(provider: MongoProvider, characterId: number){
        if((await provider.connection.db.listCollections({name: `${characterId}_notifications`}).toArray()).length == 0){
            return provider.connection.db.createCollection(`${characterId}_notifications`);
        }
    }

    static async createIndex(provider: MongoProvider, characterId: number) {
        await this.createCollection(provider, characterId);
        if(await this.hasIndex(provider, characterId)) return Promise.resolve();
        return await provider.connection.collection(characterId.toString() + "_notifications").createIndex(
            index,
            {
                unique: true
            }
        );
    }
    
    static async hasIndex(provider: MongoProvider, characterId: number) {
        var indexes: {[key: string]:Array<Array<{[key: string]: number}>>} = (await provider.connection.collection(characterId.toString() + "_notifications").getIndexes());
        return indexes.hasOwnProperty(`${indexKey}_1`);
    }

    static async getNotification(provider: MongoProvider, characterId: number, notification: CharNotification): Promise<CharNotification> {
        return await provider.connection.collection(characterId.toString() + "_notifications").findOne({ "notification_id": notification.notification_id });
    }

    static async getNotifications(provider: MongoProvider, characterId: number) {
        return await provider.connection.collection(characterId.toString() + "_notifications").find().toArray() as Array<CharNotification>;
    }

    static async saveOrUpdateNotification(provider: MongoProvider, characterId: number, notification: CharNotification) {
        return await provider.connection.collection(characterId.toString() + "_notifications").updateOne({ "notification_id": notification.notification_id }, { $set: notification }, { upsert: true });
    }

    static async removeOldNotifications(provider: MongoProvider, characterId: number, notification: Array<CharNotification>) {
        if(notification == null || notification.length < 1) return Promise.resolve();
        var filter: Array<number> = notification.map((item) =>
            item.notification_id
        );
        //find with nor
        let oldNotifications: Array<CharNotification> = await provider.connection.collection(characterId.toString() + "_notifications").find({
            "notification_id": {
                $nin: filter
            }
        }).toArray();

        //delete notifications that are returned
        this.deleteNotifications(provider, characterId, oldNotifications);
    }

    static async deleteAll(provider: MongoProvider, characterId: number) {
        return await provider.connection.collection(characterId.toString() + "_notifications").deleteMany({});
    }

    static async deleteNotification(provider: MongoProvider, characterId: number, notification: CharNotification) {
        if (notification == null) return Promise.resolve();
        return await provider.connection.collection(characterId.toString() + "_notifications").deleteOne({ "notification_id": notification.notification_id });
    }

    static async deleteNotifications(provider: MongoProvider, characterId: number, notification: Array<CharNotification>) {
        if (notification == null || notification.length == 0) return Promise.resolve();
        var filter: Array<Object> = notification.map((item) => { return { "notification_id": item.notification_id } });
        return await provider.connection.collection(characterId.toString() + "_notifications").deleteMany({ $or: filter });
    }

    static async isPresent(provider: MongoProvider, characterId: number, notification: CharNotification) {
        return await provider.connection.collection(characterId.toString() + "_notifications").find({ "notification_id": notification.notification_id }).count() > 0;
    }

    static async isNotifyable(characterId: number, notification: CharNotification) {
        return notification.type.toString() == Type[Type.StructureUnderAttack];
    }

}