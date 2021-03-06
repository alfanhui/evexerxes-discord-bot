import ESI, { Token } from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider';
import { red, amber, yellow, green, blue, DiscordNotifier, } from '../notifier/discordNotifier';
import { EmbedFieldData, MessageEmbed } from 'discord.js';
import { AcceptedChannelMongo } from '../daos/discordDAO';
import { Corporation } from '../api/corporation/corporationAPI';
import { getCorporationIconURL } from '../data/images';
import { getCorpStructures, CorpStructure, FuelNotify } from '../api/corporation/structuresAPI';
import { CorpStructuresQueries } from '../daos/corpStructuresDAO';
import { getSystemInfo, System } from '../api/universe/systemAPI';

export async function syncFuel(provider: MongoProvider, esi: ESI, discordNotifier: DiscordNotifier, channels: Array<AcceptedChannelMongo>, characterId: number, corporation: Corporation): Promise<void> {
    try {
        //Request update from Eve API
        const token: Token = await provider.getToken(characterId, 'esi-corporations.read_structures.v1');
        const structures: Array<CorpStructure> = await getCorpStructures(esi, token, corporation.corporation_id);

        //Remove any contacts that aren't in the original request.
        CorpStructuresQueries.removeOldStructures(provider, corporation.corporation_id, structures);

        for (const structure of structures) {
            //Compare results with existing
            const currentStatus: FuelNotify = await CorpStructuresQueries.getFuelNotifyStatus(provider, corporation.corporation_id, structure);
            if (currentStatus == FuelNotify.UNKNOWN || currentStatus == FuelNotify.NO_CHANGE) continue;
            const currentFuelStatus: FuelNotify = CorpStructuresQueries.calculateCurrentFuelStatus(structure);
            //Post to Discord any notifications
            const message: MessageEmbed = await compileEmbedMessage(esi, corporation, token, structure, currentFuelStatus);
            discordNotifier.postChannelsMsg(channels, message);
            //Save new results
            structure.previous_fuel_status = currentFuelStatus;
            CorpStructuresQueries.saveOrUpdateStructure(provider, corporation.corporation_id, structure);
        }
    } catch (e) {
        console.error(e)
        return null;
    } finally{
        console.log(`FuelScheduler finished for ${corporation.name}`)
    }
}

async function compileEmbedMessage(esi: ESI, corporation: Corporation, token: Token, corpStructure: CorpStructure, currentFuelStatus: FuelNotify): Promise<MessageEmbed> {
    const system: System = await getSystemInfo(esi, null, corpStructure.system_id);
    var title, description = "";
    var colour: number;
    var fields: Array<EmbedFieldData> = [];
    var location = system.name;
    switch (currentFuelStatus) {
        case FuelNotify.EMPTY:
            title = 'No Power'
            colour = red;
            description = `**${corpStructure.name}**: Fuel Empty.\nServices at risk:`
            for(const service of corpStructure.services){
                fields.push(  { name: `${service.name}`, value: `${service.state}`, inline: true});
            }
            fields.push({ name: '\u200B', value: '\u200B' }); //break
            break;
        case FuelNotify.ONE_DAY:
            title = 'Low Power'
            colour = amber;
            description = `**${corpStructure.name}** has less than **1 day** of fuel left.`
            break;
        case FuelNotify.THREE_DAY:
            title = 'Medium Power'
            colour = yellow;
            description = `**${corpStructure.name}** has less than **3 days** of fuel left.`
            break;
        case FuelNotify.SEVEN_DAY:
            title = 'High Power'
            colour = blue;
            description = `**${corpStructure.name}** has less than **7 days** of fuel left.`
            break;
        case FuelNotify.SEVEN_DAY_PLUS:
            title = 'Full Power'
            colour = green;
            description =  `**${corpStructure.name}** has been refuelled.`
        default:
            break;
    }

    const embed = new MessageEmbed()
        .setAuthor(`${corporation.name}`, getCorporationIconURL(corporation.corporation_id))
        .setTitle(title)
        .setColor(colour)
        .setThumbnail('https://image.eveonline.com/Type/4312_128.png') //fuel block
        .setDescription(description)
        .setFooter('fueled until:')
        .setTimestamp(Date.parse(corpStructure.fuel_expires))
    if(fields) embed.addFields(fields);
    embed.addField("location:", location);
    return Promise.resolve(embed);
}

