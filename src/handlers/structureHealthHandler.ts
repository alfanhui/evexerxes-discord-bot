import ESI, { Token } from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider';
import { red, amber, yellow, green, blue, black, DiscordNotifier } from '../notifier/discordNotifier';
import { EmbedFieldData, MessageEmbed } from 'discord.js';
import { AcceptedChannelMongo } from '../daos/discordDAO';
import { Corporation } from '../api/corporation/corporationAPI';
import { getCorporationIconURL } from '../data/images';
import { getCorpStructures, CorpStructure, StructureState } from '../api/corporation/structuresAPI';
import { CorpStructuresQueries } from '../daos/corpStructuresDAO';
import { getSystemInfo, System } from '../api/universe/systemAPI';
import { dateOptions } from '../utils/date';

export async function syncStructureHealth(provider: MongoProvider, esi: ESI, discordNotifier: DiscordNotifier, channels: Array<AcceptedChannelMongo>, characterId: number, corporation: Corporation): Promise<void> {
    try {
        //Request update from Eve API
        const token: Token = await provider.getToken(characterId, 'esi-corporations.read_structures.v1');
        const structures: Array<CorpStructure> = await getCorpStructures(esi, token, corporation.corporation_id);

        //Remove any contacts that aren't in the original request.
        CorpStructuresQueries.removeOldStructures(provider, corporation.corporation_id, structures);

        for (const structure of structures) {
            var previousStructure: CorpStructure = await CorpStructuresQueries.getStructure(provider, corporation.corporation_id, structure);
            //Compare results with existing
            if (await CorpStructuresQueries.isHealthNotifable(provider, corporation.corporation_id, structure)) {
                //Post to Discord any notifications
                const message: MessageEmbed = await compileEmbedMessage(esi, corporation, token, structure, previousStructure);
                discordNotifier.postChannelsMsg(channels, message);
                //Save new results
                if(previousStructure){
                    structure.previous_fuel_status = previousStructure.previous_fuel_status != null ? previousStructure.previous_fuel_status : CorpStructuresQueries.calculateCurrentFuelStatus(structure);
                }
                CorpStructuresQueries.saveOrUpdateStructure(provider, corporation.corporation_id, structure);
            }
        }
    } catch (e) {
        console.error(e)
        return null;
    } finally{
        console.log(`StructureHealthScheduler finished for ${corporation.name}`)
    }
}

async function compileEmbedMessage(esi: ESI, corporation: Corporation, token: Token, corpStructure: CorpStructure, previousState: CorpStructure): Promise<MessageEmbed> {
    const system: System = await getSystemInfo(esi, null, corpStructure.system_id);
    
    var title, description = "";
    var colour: number;
    var fields: Array<EmbedFieldData> = [];
    var location = system.name;
    if (corpStructure?.state_timer_end) {
        fields.push({ name: "Defend time:", value: `${new Date(corpStructure.state_timer_end).toLocaleDateString("en-US", dateOptions)} (EVE Time)` });
    }
    switch (corpStructure.state.toString()) {
        case StructureState[StructureState.anchor_vulnerable]:
            title = "New Structure Anchor Placed"
            colour = amber;
            description = `A 15-minute timer has started until anchor reinforcement mode.`;
            break;
        case StructureState[StructureState.anchoring]:
            title = "New Structure Anchor In 24h Cooldown"
            colour = yellow;
            description = `**${corpStructure.name}**`
            break;
        case StructureState[StructureState.fitting_invulnerable]:
            title = "New Structure in Fitting Stage"
            colour = yellow;
            description = `**${corpStructure.name}** 5-minute period where it is invulnerable and can be boarded and fitted before Onlining Vulnerability stage.`    
            break;
        case StructureState[StructureState.onlining_vulnerable]:
            title = "Insert Quantum Core Into New Structure"
            colour = blue;
            description = `A Quantum Core can now be inserted into the new structure: **${corpStructure.name}**. Once inserted, a 15-minute timer will start until fully operational.`;
            break;
        case StructureState[StructureState.shield_vulnerable]:
            description = `**${corpStructure.name}'s** shields are online.`;
            title = "Structure Repaired"
            colour = green;
            if(previousState){
                if (previousState.toString() !== StructureState[StructureState.onlining_vulnerable]) {
                    title = "Structure Online"
                    colour = blue;
                }
            }
            break;
        case StructureState[StructureState.armor_reinforce]:
            //Structure under first attack
            title = "Base Under Attack";
            colour = red;
            description = `**${corpStructure.name}'s** shields are down: Armour in reinforcement mode. **Prepare for defence.** \n\nThere will be a 15-minute timer until full repair on *${new Date(corpStructure.state_timer_end).toLocaleDateString("en-GB", dateOptions)}*.\n\nThe repair timer pauses while the structure is taking damage at least 10% of its damage cap.`;
            break;
        case StructureState[StructureState.armor_vulnerable]:
            title = "Armor Vulnerable";
            colour = amber;
            description = `Defend **${corpStructure.name}**.\n\nIt is vulnerable to attacks until the 15 minutes repair timer completes.`;
            break;
        case StructureState[StructureState.hull_reinforce]:
            title = "Hull In Reinforcement Mode";
            colour = red;
            description = `**${corpStructure.name}'s** armour is down: Hull in reinforcement mode. **Prepare for final defence.** \n\nThere will be a 30-minute timer until full repair on *${new Date(corpStructure.state_timer_end).toLocaleDateString("en-GB", dateOptions)}*.\n\nThe repair timer pauses while the structure is taking damage at least 10% of its damage cap.`;
            break;
        case StructureState[StructureState.hull_vulnerable]:
            title = "Hull Vulnerable";
            colour = black;
            description = `**${corpStructure.name}**: Attack imminent. Brace. Brace.\n\nIt is vulnerable to **destruction** until the 30 minutes repair timer completes.`
            break;
        default:
            title = "Structure State Changed";
            colour = black;
            description = `**${corpStructure.name}** is in ${corpStructure.state.toString()} state.`
    }

    const embed = new MessageEmbed()
        .setAuthor(`${corporation.name}`, getCorporationIconURL(corporation.corporation_id))
        .setTitle(title)
        .setColor(colour)
        .setThumbnail(`https://image.eveonline.com/Type/${corpStructure.type_id}_128.png`)
        .setDescription(description);
    if (corpStructure?.state_timer_start) {
        embed
            .setFooter('state changed at:')
            .setTimestamp(Date.parse(corpStructure.state_timer_start));
    }
    if (fields) embed.addFields(fields);
    embed.addField("location:", location);
    embed.addField("current state:", corpStructure.state);
    return Promise.resolve(embed);
}

