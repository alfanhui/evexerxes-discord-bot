import Discord, { MessageEmbed, TextChannel } from 'discord.js';
import MongoProvider from 'eve-esi-client-mongo-provider';
import { AcceptedChannelMongo, AdminUserMongo, DiscordQueries } from '../daos/discordDAO';

export const red: number = 0xff0000;
export const amber: number = 0xFF8000;
export const yellow: number = 0xFFFE00;
export const green: number = 0x00FF80;
export const purple: number = 0x8000FF;
export const blue: number = 0x0080FF;
export const black: number = 0x000000;

export class DiscordNotifier {
    client = new Discord.Client();
    provider: MongoProvider;

    constructor(provider: MongoProvider) {
        this.provider = provider;
        this.client.on('ready', () => {
            console.log(`Logged in as ${this.client.user.tag}!`);
            this.client.user.setPresence({
                status: "online", //You can show online, idle....
                activity: {
                    name: "Pixel Knights", //The message shown
                    type: "WATCHING" //PLAYING: WATCHING: LISTENING: STREAMING:
                }
            });
        });

        this.client.on('message', async (msg) => this.onMessage(msg));
        this.client.login(process.env.DISCORD_TOKEN);
        console.debug("Discord has logged in.")
    }

    async postChannelsMsg(channels: Array<AcceptedChannelMongo>, embedMsg: MessageEmbed) {
        for(const channel  of channels){
            if(process.env?.DEBUG){
                if(channel.channelId != process.env?.DISCORD_TEST_CHANNEL) continue;
            }else{
                if(channel.channelId == process.env?.DISCORD_TEST_CHANNEL) continue;
            }
            const channelObject = this.client.channels.cache.find(ch => ch.id === channel.channelId);
            if (channelObject.isText()) {
               await ( <TextChannel>channelObject).send(embedMsg);
            }
        }
    }

    postPrivateMsg(userId: string, embedMsg: MessageEmbed) {
        const user = this.client.users.cache.find(user => user.id == userId);
        user.send(embedMsg);
    }

    async onMessage(msg: Discord.Message): Promise<any> {
        try {
            // if (msg.content.startsWith('.')) {
            //     msg.reply(await this.compileEmbedMessage('12345', null));
            //     return null;
            // }
            //don't react to messages from itself
            if (msg.author.id === this.client.user.id) {
                return null;
            }
            if(!msg.content) return null;
            //Only react if message is a command
            if (!msg.content[0].match(/^[!]+$/)) return null;
            //setup and help
            switch (msg.content) {
                case '!evexerxes-init':
                    if (await DiscordQueries.isAcceptedChannel(this.provider, msg.channel.id)) {
                        msg.reply(`Channel already registered`);
                    } else {
                        await DiscordQueries.saveAcceptedChannel(this.provider, msg.channel.id);
                        if((await DiscordQueries.getAdminUsers(this.provider)).length == 0){
                            await DiscordQueries.saveAdminUser(this.provider, msg.author);
                        }
                        msg.reply(`Channel registered`);
                    }
                    return null;
                case '!evexerxes-rm':
                    await DiscordQueries.deleteAcceptedChannel(this.provider, msg.channel.id);
                    msg.reply(`Channel unregistered`);
                    return null;
                case '!evexerxes-help':
                    msg.reply(`\`\`\`bash
!evexerxes-init (register channel)
!evexerxes-rm   (unregister channel)
            \`\`\``);
                    return null;
                default:
                    break;
            }
            //From this point, admin users only.
            if (!await DiscordQueries.isAdminUser(this.provider, msg.author.id)) {
                console.log(`access denied for ${msg.author.username}`)
                msg.reply('Access Denied.')
                return null;
            }
            //Admin menu
            await this.manageAdminUsers(msg);
        } catch (e) {
            console.error(e)
            return null;
        }
    }

    async manageAdminUsers(msg: Discord.Message): Promise<void> {
        if (msg.content.startsWith('!evexerxes-admin-add')) {
            if (msg.mentions.members.size == 0) {
                msg.reply('No mentions provided.')
                return null;
            }
            msg.mentions.members.map(async (member) => {
                await DiscordQueries.saveAdminMember(this.provider, member);
                console.debug(`Member: ${member.user.username} added as an evexerxes admin`);
            });
        } else if (msg.content.startsWith('!evexerxes-admin-list')) {
            const adminUsers: Array<AdminUserMongo> = await DiscordQueries.getAdminUsers(this.provider);
            msg.reply(`Admin Users: ${adminUsers.map((item) => `${item.nickname}, `)}`)
        } else if (msg.content == '!evexerxes-admin-rm') {
            if (msg.mentions.members.size == 0) {
                msg.reply('No mentions provided.')
                return null;
            }
            msg.mentions.members.map(async (member) => {
                await DiscordQueries.deleteAdminUser(this.provider, member.id);
                console.debug(`Member: ${member.nickname} removed as an evexerxes admin`);
            });
            const adminUsers: Array<AdminUserMongo> = await DiscordQueries.getAdminUsers(this.provider);
            msg.reply(`Admin Users removed: ${adminUsers.map((item) => `${item.nickname}, `)}`)
        }  else if (msg.content == '!evexerxes-admin-wipe') {
            const adminUsers: Array<AdminUserMongo> = await DiscordQueries.getAdminUsers(this.provider);
            adminUsers.map(async (member) => {
                await DiscordQueries.deleteAdminUser(this.provider, member.memberId);
                console.debug(`Member: ${member.nickname} removed as an evexerxes admin`);
            });
            await DiscordQueries.saveAdminUser(this.provider, msg.author);
            msg.reply('All other admin users wiped, you remain admin.')
        }
    }

}