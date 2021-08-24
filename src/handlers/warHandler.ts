import ESI, { Token } from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider';
import { red, amber, green, DiscordNotifier, purple, } from '../notifier/discordNotifier';
import { EmbedFieldData, MessageEmbed, VolumeInterface } from 'discord.js';
import { AcceptedChannelMongo } from '../daos/discordDAO';
import { Corporation, getCorporationInfo } from '../api/corporation/corporationAPI';
import { getAllianceIconURL, getCorporationIconURL } from '../data/images';
import { Ally, getWar, getWars, War } from '../api/warAPI';
import { WarsQueries } from '../daos/warsDAO';
import { CorpWar, CorpWarsQueries } from '../daos/corpWarsDAO';
import { CharacterMongo } from '../daos/userDAO';
import { getAllianceInfo } from '../api/allianceAPI';
import { dateOptions } from '../utils/date';

enum WAR_MESSAGE_TYPE {
    NEW,
    UPDATE,
    FINISHED
}

export async function syncWar(provider: MongoProvider, esi: ESI, discordNotifier: DiscordNotifier, channels: Array<AcceptedChannelMongo>, characters: Array<CharacterMongo>, corporationsInOrder: Array<Corporation>): Promise<void> {
    try {

        //Request update from Eve API
        const token: Token = await provider.getToken(characters[0].characterId);
        const wars: Array<number> = await getWars(esi, token);

        //Remove any contacts that aren't in the original request.
        await WarsQueries.removeOldWars(provider, wars);

        //Get all new wars
        const newWars = await WarsQueries.getAllNotSavedYet(provider, wars);

        for (const newWar of newWars) {
            try {
                //Slow down pace in attempt to stop gateway errors
                await new Promise(resolve => setTimeout(resolve, 100));
                // Get New War details
                const warDetail = await getWar(esi, token, newWar);
                // Save New War details
                await WarsQueries.saveOrUpdateWar(provider, warDetail);

                // Cycle characters
                for (let corporation of corporationsInOrder) {
                    try {
                        // Move on if character isn't war eligible.
                        if (!corporation.war_eligible) continue;
                        // Check if involed
                        if (isInvolvedInWar(warDetail, corporation)) {
                            //Check if we knew about it
                            if (! await CorpWarsQueries.isPresent(provider, corporation.corporation_id, warDetail)) {
                                //NEW WAR! Notify Discord
                                const warType: WAR_MESSAGE_TYPE = warDetail.finished ? WAR_MESSAGE_TYPE.FINISHED : WAR_MESSAGE_TYPE.NEW;
                                const message: MessageEmbed = await compileEmbedMessage(provider, esi, corporation, token, warDetail, warType);
                                discordNotifier.postChannelsMsg(channels, message);
                            }
                            await CorpWarsQueries.saveOrUpdateWar(provider, corporation.corporation_id, warDetail)
                        }
                    } catch (e) {
                        console.error(`warDetail ${corporation.corporation_id}`, e);
                    }
                }
            } catch (e) {
                console.error(`warDetail ${newWar}`, e);
            }
        }

        // Check on existing wars
        // Cycle characters
        for (let corporation of corporationsInOrder) {
            try {
                // Move on if character isn't war eligible.
                if (!corporation.war_eligible) continue;
                const corpWars: Array<CorpWar> = await CorpWarsQueries.getCorpWars(provider, corporation.corporation_id);

                for (const corpWar of corpWars) {
                    // Get War details
                    const warDetail = await getWar(esi, token, corpWar.id);
                    if (await CorpWarsQueries.hasChanged(provider, corporation.corporation_id, warDetail)) {
                        const warType: WAR_MESSAGE_TYPE = warDetail.finished ? WAR_MESSAGE_TYPE.FINISHED : WAR_MESSAGE_TYPE.UPDATE;
                        //Notify change to War!
                        const message: MessageEmbed = await compileEmbedMessage(provider, esi, corporation, token, warDetail, warType);
                        discordNotifier.postChannelsMsg(channels, message);
                        //Update new war detail!
                        await CorpWarsQueries.saveOrUpdateWar(provider, corporation.corporation_id, warDetail)
                    }
                }
            } catch (e) {
                console.error(`existing war checks ${corporation.corporation_id}`, e);
            }
        }
    } catch (e) {
        console.error("syncWar", e)
        return null;
    }
}

function isInvolvedInWar(warDetail: War, corporation: Corporation): boolean {
    if (corporation.alliance_id) {
        if (warDetail.aggressor.alliance_id) {
            if (warDetail.aggressor?.alliance_id == corporation?.alliance_id) return true;
        }
        if (warDetail.defender.corporation_id) {
            if (warDetail.defender?.alliance_id == corporation?.alliance_id) return true;
        }
    } else {
        if (warDetail.aggressor.alliance_id) {
            if (warDetail.aggressor?.corporation_id == corporation?.corporation_id) return true;
        }
        if (warDetail.defender.corporation_id) {
            if (warDetail.defender?.corporation_id == corporation?.corporation_id) return true;
        }
    }
    for (const ally of warDetail.allies) {
        if (corporation.alliance_id && ally.alliance_id) {
            if (ally?.alliance_id == corporation?.alliance_id) return true;
        }
        if (corporation.corporation_id && ally.alliance_id) {
            if (ally?.corporation_id == corporation?.corporation_id) return true;
        }
    }
    return false;
}

function isAggressor(warDetail: War, corporation: Corporation): boolean {
    if (warDetail.aggressor.alliance_id && corporation.alliance_id) {
        if (warDetail.aggressor?.alliance_id == corporation?.alliance_id) return true;
    }
    if (warDetail.aggressor.corporation_id && corporation.corporation_id) {
        if (warDetail.aggressor?.corporation_id == corporation?.corporation_id) return true;
    }
    for (const ally of warDetail.allies) {
        if (ally.alliance_id && corporation.alliance_id) {
            if (ally?.alliance_id == corporation?.alliance_id) return true;
        }
        if (ally.corporation_id && corporation.corporation_id) {
            if (ally?.corporation_id == corporation?.corporation_id) return true;
        }
    }
    return false;
}

async function getAggressor(esi: ESI, token: Token, warDetail: War): Promise<GroupEntity> {
    var name: string;
    var link: string;
    if (warDetail.aggressor.alliance_id) {
        name = (await getAllianceInfo(esi, token, warDetail.aggressor.alliance_id)).name;
        link = `https://evemaps.dotlan.net/alliance/${warDetail.aggressor.alliance_id}`;
    } else {
        name = (await getCorporationInfo(esi, token, warDetail.aggressor.corporation_id)).name;
        link = `https://evemaps.dotlan.net/corp/${warDetail.aggressor.corporation_id}`
    }
    return { name, link }
}

async function getDefender(esi: ESI, token: Token, warDetail: War): Promise<GroupEntity> {
    var name: string;
    var link: string;
    if (warDetail.defender.alliance_id) {
        name = (await getAllianceInfo(esi, token, warDetail.defender.alliance_id)).name;
        link = `https://evemaps.dotlan.net/alliance/${warDetail.defender.alliance_id}`

    } else {
        name = (await getCorporationInfo(esi, token, warDetail.defender.corporation_id)).name;
        link = `https://evemaps.dotlan.net/corp/${warDetail.defender.corporation_id}`
    }
    return { name, link }
}

async function getAllyName(esi: ESI, token: Token, ally: Ally): Promise<string> {
    return ally.alliance_id ? (await getAllianceInfo(esi, token, ally.alliance_id)).name : (await getCorporationInfo(esi, token, ally.corporation_id)).name;
}

async function compileEmbedMessage(provider: MongoProvider, esi: ESI, corporation: Corporation, token: Token, warDetail: War, war_type: WAR_MESSAGE_TYPE): Promise<MessageEmbed> {
    const aggressor: GroupEntity = await getAggressor(esi, token, warDetail);
    const defender: GroupEntity = await getDefender(esi, token, warDetail);
    const aggressorNameLink = `**[${aggressor.name}](${aggressor.link})**`
    const defenderNameLink = `**[${defender.name}](${defender.link})**`
    var title, description = "";
    var colour: number;
    var thumbnail;
    var fields: Array<EmbedFieldData> = [];

    //Allies
    if (warDetail.allies != null && warDetail.allies.length > 0) {
        var allyNames: Array<string> = [];
        for (var ally of warDetail.allies) {
            allyNames.push(await getAllyName(esi, token, ally));
        }
        fields.push({ name: `Allies with ${defender.name}:`, value: `${allyNames.join(', ')}` });
    }

    switch (war_type) {
        case WAR_MESSAGE_TYPE.NEW:
            description = `${aggressorNameLink} have declared war to ${defenderNameLink}.`
            if (warDetail.started) {
                fields.push({ name: "Starts at:", value: `${new Date(warDetail.started).toLocaleDateString("en-US", dateOptions)}` });
            }
            if (isAggressor(warDetail, corporation)) {
                title = "WAR CONFIRMED!"
                colour = purple;
                thumbnail = warDetail.defender.alliance_id ? getAllianceIconURL(warDetail.defender.alliance_id) : getCorporationIconURL(warDetail.defender.corporation_id);
            } else {
                title = "WAR DEC'ed!"
                colour = red;
                thumbnail = warDetail.aggressor.alliance_id ? getAllianceIconURL(warDetail.aggressor.alliance_id) : getCorporationIconURL(warDetail.aggressor.corporation_id);
            }
            break;
        case WAR_MESSAGE_TYPE.FINISHED:
            title = 'WAR IS OVER!'
            colour = green;
            description = `The war between ${aggressorNameLink} and ${defenderNameLink} has ended. Finished at: ${new Date(warDetail.finished).toLocaleDateString("en-US", dateOptions)}`
            if (isAggressor(warDetail, corporation)) {
                thumbnail = warDetail.defender.alliance_id ? getAllianceIconURL(warDetail.defender.alliance_id) : getCorporationIconURL(warDetail.defender.corporation_id);
            } else {
                thumbnail = warDetail.aggressor.alliance_id ? getAllianceIconURL(warDetail.aggressor.alliance_id) : getCorporationIconURL(warDetail.aggressor.corporation_id);
            }
            //Stats
            fields.push({
                name: `Final Stats`, value: `
                            \u200B${aggressor.name} has killed ${warDetail.aggressor.ships_killed} ships, worth ${warDetail.aggressor.isk_destroyed.toFixed(0)} ISK
                            \u200B${defender.name} et al has killed ${warDetail.defender.ships_killed} ships, worth ${warDetail.defender.isk_destroyed.toFixed(0)} ISK
                        `});

            break;
        case WAR_MESSAGE_TYPE.UPDATE:
        default:
            title = 'WAR UPDATE!'
            colour = amber;
            description = `The war between ${aggressorNameLink} and ${defenderNameLink} has been updated.`
            const previousWarDetail = await WarsQueries.getWar(provider, warDetail.id);
            //Check for changes
            if (warDetail.open_for_allies != previousWarDetail.open_for_allies) {
                fields.push({ name: "Defender open for Allies:", value: warDetail.open_for_allies.valueOf() });
            }
            if (warDetail.retracted != previousWarDetail.retracted) {
                fields.push({ name: "War retracted changed:", value: `Was: ${new Date(previousWarDetail.retracted).toLocaleDateString("en-US", dateOptions)}, now: ${new Date(warDetail.retracted).toLocaleDateString("en-US", dateOptions)}` });
            }
            if (warDetail.started != previousWarDetail.started) {
                fields.push({ name: "War has started:", value: `${new Date(warDetail.started).toLocaleDateString("en-US", dateOptions)}` });
            }
            //Stats
            fields.push({
                name: `Stats`, value: `
                \u200B${aggressor.name} has killed ${warDetail.aggressor.ships_killed} ships, worth ${warDetail.aggressor.isk_destroyed.toFixed(0)} ISK
                \u200B${defender.name} et al has killed ${warDetail.defender.ships_killed} ships, worth ${warDetail.defender.isk_destroyed.toFixed(0)} ISK
                ` });
            //Thumbnail
            if (isAggressor(warDetail, corporation)) {
                thumbnail = warDetail.defender.alliance_id ? getAllianceIconURL(warDetail.defender.alliance_id) : getCorporationIconURL(warDetail.defender.corporation_id);
            } else {
                thumbnail = warDetail.defender.alliance_id ? getAllianceIconURL(warDetail.defender.alliance_id) : getCorporationIconURL(warDetail.defender.corporation_id);
            }
            break;
    }

    const embed = new MessageEmbed()
        .setAuthor(`${corporation.name}`, getCorporationIconURL(corporation.corporation_id))
        .setTitle(title)
        .setColor(colour)
        .setDescription(description)
        .setThumbnail(thumbnail)
        .setFooter('Declared:')
        .setTimestamp(new Date(warDetail.declared))
    fields.push({ name: "Dotland.net:", value: `https://evemaps.dotlan.net/war/${warDetail.id}` })
    if (fields) embed.addFields(fields);
    return Promise.resolve(embed);
}

interface GroupEntity {
    name: string
    link: string
}