import ESI, { Token } from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider';
import { red, amber, yellow, green, blue, black, DiscordNotifier } from '../notifier/discordNotifier';
import { EmbedFieldData, MessageEmbed } from 'discord.js';
import { AcceptedChannelMongo } from '../daos/discordDAO';
import { Corporation } from '../api/corporation/corporationAPI';
import { getCorporationIconURL } from '../data/images';
import { getCharNotifications, parseTextToIDs, CharNotification } from '../api/character/notificationsAPI';
import { CharNotificationsQueries } from '../daos/charNotificationsDAO';
import { getStructureInfo, Structure } from '../api/universe/structureAPI';


export async function syncCharNotifications(provider: MongoProvider, esi: ESI, discordNotifier: DiscordNotifier, channels: Array<AcceptedChannelMongo>, characterId: number, corporation: Corporation): Promise<void> {
    try {
        //Request update from Eve API
        const token: Token = await provider.getToken(characterId, 'esi-characters.read_notifications.v1');
        const notifications: Array<CharNotification> = await getCharNotifications(esi, token, characterId);

        //Remove any contacts that aren't in the original request.
        CharNotificationsQueries.removeOldNotifications(provider, characterId, notifications);

        for (const notification of notifications) {
            var isOldNotification: boolean = await CharNotificationsQueries.isPresent(provider, characterId, notification);

            if(!isOldNotification) {
                if(await CharNotificationsQueries.isNotifyable(characterId, notification)) {
                    await parseTextToIDs(notification);
                    const message: MessageEmbed = await compileEmbedMessage(esi, corporation, token, notification);
                    discordNotifier.postChannelsMsg(channels, message);
                }
                CharNotificationsQueries.saveOrUpdateNotification(provider, characterId, notification);
            }
        }
    } catch (e) {
        console.error(e)
        return null;
    } finally{
        console.log(`StructureHealthScheduler finished for ${corporation.name}`)
    }
}

async function compileEmbedMessage(esi: ESI, corporation: Corporation, token: Token, notification: CharNotification): Promise<MessageEmbed> {
    let structure: Structure = null;
    
    if(notification.structureID) {
        structure = (await getStructureInfo(esi, token, notification.structureID));
    }

    const embed = new MessageEmbed()
        .setAuthor(`${corporation.name}`, getCorporationIconURL(corporation.corporation_id))
        .setTitle('A Structure is getting attacked!')
        .setColor(red)
        .setDescription('Go defend it now!');

    if(notification.structureTypeID) {
        embed.setThumbnail(`https://image.eveonline.com/Type/${notification.structureTypeID}_128.png`)
    }

    if(structure) {
        embed.addField("structure:", structure.name);
    }

    if(notification.corpName) {
        embed.addField("attacker:", notification.corpName);
    }

    return Promise.resolve(embed);
}

