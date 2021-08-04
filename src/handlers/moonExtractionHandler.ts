import ESI, { Token } from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider';
import { DiscordNotifier, purple, } from '../notifier/discordNotifier';
import { EmbedFieldData, MessageEmbed } from 'discord.js';
import { AcceptedChannelMongo } from '../daos/discordDAO';
import { Corporation } from '../api/corporation/corporationAPI';
import { getCorporationIconURL } from '../data/images';
import { getCorporationMoonExtractions, MoonExtraction } from '../api/corporation/moonExtractionAPI';
import { CorpMoonExtractionsQueries } from '../daos/corpMoonExtractionDAO';
import { getStructureInfo, Structure } from '../api/universe/structureAPI';
import { getMoonInfo, Moon } from '../api/universe/moonAPI';
import { getDuration, timeOptions } from '../utils/date';

export async function syncMoonExtraction(provider: MongoProvider, esi: ESI, discordNotifier: DiscordNotifier, channels: Array<AcceptedChannelMongo>, characterId: number, corporation: Corporation): Promise<void> {
    try {
        //Request update from Eve API
        const token: Token = await provider.getToken(characterId, 'esi-industry.read_corporation_mining.v1');
        const moonExtractions: Array<MoonExtraction> = await getCorporationMoonExtractions(esi, token, corporation.corporation_id);

        //Remove any extractions that aren't in the original request.
        CorpMoonExtractionsQueries.removeOldMoonExtractions(provider, corporation.corporation_id, moonExtractions);

        for (const moonExtraction of moonExtractions) {
            //Compare results with existing
            if(!await CorpMoonExtractionsQueries.isNotifiable(provider, corporation.corporation_id, moonExtraction)) continue;
            //Post to Discord any notifications
            const message: MessageEmbed = await compileEmbedMessage(esi, corporation, token, moonExtraction);
            discordNotifier.postChannelsMsg(channels, message);
            //Save new results
            moonExtraction.has_been_notified = true;
            CorpMoonExtractionsQueries.saveOrUpdateMoonExtraction(provider, corporation.corporation_id, moonExtraction);
        }
    } catch (e) {
        console.error(e)
        return null;
    }
}

async function compileEmbedMessage(esi: ESI, corporation: Corporation, token: Token, moonExtraction: MoonExtraction): Promise<MessageEmbed> {
    const structure: Structure = await getStructureInfo(esi, token, moonExtraction.structure_id);
    const moon: Moon = await getMoonInfo(esi, null, moonExtraction.moon_id);

    const title = 'Moon Extraction Today';
    const colour: number = purple;
    const fields: Array<EmbedFieldData> = [];
    const description = `**${structure.name}** can be popped today at ${new Date(moonExtraction.chunk_arrival_time).toLocaleDateString("en-GB", timeOptions)}\n(EVE Time).`
    fields.push({ name: "Location:", value: `${moon.name}`, inline:true});
    const brewTime = getDuration(moonExtraction.extraction_start_time, moonExtraction.chunk_arrival_time);
    if (brewTime !== "") {
        fields.push(  { name: "Brew time:", value: `${brewTime}`, inline: true});
    }
   
    const embed = new MessageEmbed()
        .setAuthor(`${corporation.name}`, getCorporationIconURL(corporation.corporation_id))
        .setTitle(title)
        .setColor(colour)
        //.setThumbnail('https://wiki.eveuniversity.org/images/2/22/Logo_faction_outer_ring_excavations.png')
        .setThumbnail('https://media.giphy.com/media/uYCQLIUdzkXI8MbOK1/giphy.gif')
        .setDescription(description)
        .addFields(fields)
        .setFooter('Auto pops at:')
        .setTimestamp(new Date(Date.parse(moonExtraction.natural_decay_time)));
    return Promise.resolve(embed);
}

