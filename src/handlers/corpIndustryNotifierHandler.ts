import MongoProvider from 'eve-esi-client-mongo-provider';
import { blue, DiscordNotifier } from '../notifier/discordNotifier';
import { EmbedFieldData, MessageEmbed } from 'discord.js';
import { AcceptedChannelMongo } from '../daos/discordDAO';
import { Corporation } from '../api/corporation/corporationAPI';
import { getCorporationIconURL } from '../data/images';
import { BlueprintDAOModel, CorpBlueprintDAOModelQueries } from '../daos/corpBlueprintsDAO';
import { ActivityIndex, IStatus } from '../api/corporation/IndustryAPI';

export async function syncCorpIndustryNotifierHandler(provider: MongoProvider, discordNotifier: DiscordNotifier, channels: Array<AcceptedChannelMongo>, corporation: Corporation): Promise<void> {
    try {
        const blueprintDAOModels: Array<BlueprintDAOModel> = await CorpBlueprintDAOModelQueries.getBlueprintDAOModels(provider, corporation.corporation_id);
        if (blueprintDAOModels.length < 1) return null;

        const message: MessageEmbed = await compileEmbedMessage(corporation, blueprintDAOModels);
        discordNotifier.postChannelsMsg(channels, message);

        //Reset increases as now notified, and save them to database
        blueprintDAOModels.forEach(value => {
            value.material_efficiency_increase = 0;
            value.time_efficiency_increase = 0;
            value.copies_made = 0;
            value.runs_made = 0;
            CorpBlueprintDAOModelQueries.saveOrUpdateBlueprintDAOModel(provider, corporation.corporation_id, value);
        })

    } catch (e) {
        console.error(e)
        return null;
    } finally {
        console.log(`IndustryNotifierScheduler finished for ${corporation.name}`)
    }
}

async function compileEmbedMessage(corporation: Corporation, blueprintDAOModels: Array<BlueprintDAOModel>): Promise<MessageEmbed> {
    var title: string = "Industry Jobs Update"
    var description: string = `${corporation.name} Weekly Industry Job Updates`;
    var colour: number = blue;
    var fields: Array<EmbedFieldData> = [];


    //Ready
    let completedBlueprints = blueprintDAOModels.filter(value => value.material_efficiency_increase > 0 || value.time_efficiency_increase > 0 || value.copies_made > 0 || value.runs_made > 0);
    if (completedBlueprints.length > 0) {
        fields.push({ name: "Completed BPOs", value: `${completedBlueprints.map((value) => shortenBPOName(value.name, value.type_id, true) + "\n").join(' ')}`, inline: true });
        fields.push({
            name: "Manu.|M|T|Copies", value: `${completedBlueprints.map((value) => {
                return `${value.runs_made > 0 ? 'x' + value.runs_made : '~~0~~'}|${value.material_efficiency_increase > 0 ? '+' + value.material_efficiency_increase : '~~0~~'}|${value.time_efficiency_increase > 0 ? '+' + value.time_efficiency_increase : '~~0~~'}|${value.copies_made > 0 ? 'x' + value.copies_made : '~~0~~'}\n`
            }).join(' ')}`, inline: true
        });
    }

    //In progress
    let inProgressBlueprints = blueprintDAOModels.filter(value => value.status != IStatus.ready && value.status != IStatus.delivered);
    if (inProgressBlueprints.length > 0) {
        fields.push({ name: "Active BPOs", value: `${inProgressBlueprints.map((value) => shortenBPOName(value.name, value.type_id, true) + "\n").join(' ')}`, inline: true });
        fields.push({ name: "Activity", value: `${inProgressBlueprints.map((value) => shortenActivityIndexString(value.current_activity) + "\n").join(' ')}`, inline: true });
        fields.push({
            name: "Value", value: `${inProgressBlueprints.map((value) => {
                switch (value.current_activity) {
                    case ActivityIndex[ActivityIndex.manufacturing]:
                        return `x${value.runs_made}\n`;
                    case ActivityIndex[ActivityIndex.copying]:
                        return `x${value.copies_made}\n`;
                    case ActivityIndex[ActivityIndex.researching_material_efficiency]:
                        return `${value.material_efficiency}/${value.time_efficiency} → ${value.material_efficiency + 1}/${value.time_efficiency}\n`;
                    case ActivityIndex[ActivityIndex.researching_time_efficiency]:
                        return `${value.material_efficiency}/${value.time_efficiency} → ${value.material_efficiency}/${value.time_efficiency + 2}\n`;
                    default:
                        return '\n'
                }
            }).join(' ')}`, inline: true
        });
    }

    let deliverableBlueprints = blueprintDAOModels.filter(value => value.status == IStatus.ready || value.status == IStatus.delivered);
    if(deliverableBlueprints.length > 0){
        fields.push({ name: "Deliverable BPOs", value: `${deliverableBlueprints.map((value) => shortenBPOName(value.name, value.type_id, false) + "\n").join(' ')}`, inline: true });
    }

    //Compile message
    const embed = new MessageEmbed()
        .setAuthor(`${corporation.name}`, getCorporationIconURL(corporation.corporation_id))
        .setTitle(title)
        .setColor(colour)
        .setThumbnail(`http://eve-inspiracy.com/images/shipblueprints/bp-taranis.jpg`)
        .setDescription(description)
        //.setFooter('State changed at:')
        .setTimestamp(Date.now());

    embed.addFields(fields);

    return Promise.resolve(embed);
}


function shortenBPOName(name: string, type_id: number, shorten: boolean) {
    name = name.replaceAll('Blueprint', '');
    name = name.replaceAll('Medium', '(M)');
    name = name.replaceAll('Large', '(L)');
    name = name.replaceAll('Small', '(S)');
    name = name.trimStart();
    name = name.trimEnd();
    if (shorten && name.length > 25) {
        name = name.substring(0, 20) + '...';
    }
    return `[${name}](http://games.chruker.dk/eve_online/item.php?type_id=${type_id})`
}

function shortenActivityIndexString(activity: string) {
    activity = activity.replace('manufacturing', 'Manufacture');
    activity = activity.replace('researching_material_efficiency', 'Researching material');
    activity = activity.replace('researching_time_efficiency', 'Researching time');
    return activity
}
