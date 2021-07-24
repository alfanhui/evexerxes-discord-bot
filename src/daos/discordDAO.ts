import MongoProvider from 'eve-esi-client-mongo-provider';
import Discord from 'discord.js';

export interface AdminUserMongo {
    memberId: string,
    nickname: string
}

export interface AcceptedChannelMongo {
    channelId: string
} 

const acceptedChannelsCollection: string = 'discord_accepted_channels';
const adminUsersCollection: string = 'discord_admin_users';

export class DiscordQueries {
    static async getAcceptedChannels(provider: MongoProvider) {
        return await provider.connection.db.collection(acceptedChannelsCollection).find().toArray() as Array<AcceptedChannelMongo>;
    }

    static async getAdminUsers(provider: MongoProvider) {
        return await provider.connection.db.collection(adminUsersCollection).find().toArray() as Array<AdminUserMongo>;
    }

    static async saveAcceptedChannel(provider: MongoProvider, channelId: string) {
        return await provider.connection.collection(acceptedChannelsCollection).save({ channelId });
    }

    static async saveAdminMember(provider: MongoProvider, member: Discord.GuildMember) {
        return await provider.connection.collection(adminUsersCollection).insertOne({ memberId: member.id, nickname: member.nickname });
    }

    static async saveAdminUser(provider: MongoProvider, member: Discord.User) {
        return await provider.connection.collection(adminUsersCollection).insertOne({ memberId: member.id, nickname: member.username });
    }

    static async deleteAcceptedChannel(provider: MongoProvider, channelId: string) {
        return await provider.connection.db.collection(acceptedChannelsCollection).deleteOne({ channelId });
    }

    static async deleteAdminUser(provider: MongoProvider, memberId: string) {
        return await provider.connection.db.collection(adminUsersCollection).deleteOne({ memberId });
    }

    static async isAdminUser(provider: MongoProvider, memberId: string) {
        return await provider.connection.collection(adminUsersCollection).find({ memberId }).count() > 0;
    }

    static async isAcceptedChannel(provider: MongoProvider, channelId: string) {
        return await provider.connection.collection(acceptedChannelsCollection).find({ channelId }).count() > 0;
    }
}