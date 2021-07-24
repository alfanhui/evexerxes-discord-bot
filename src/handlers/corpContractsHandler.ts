import ESI, { Token } from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider';
import { CharacterPublic, getPublicCharacterInfo } from '../api/characterAPI';
import { CorpContract, getCorpContracts, IType } from '../api/corpContractsAPI';
import { ContractQueries } from "../daos/contractDAO";
import { blue, DiscordNotifier } from '../notifier/discordNotifier';
import { MessageEmbed } from 'discord.js';
import { AcceptedChannelMongo } from '../daos/discordDAO';
import { Corperation } from '../api/corperationAPI';
import { getCorperationIconURL, getProfilePictureURL, ICON_URLS } from '../data/images';
import { getStationInfo, Station } from '../api/stationAPI';
import { getRouteInfo } from '../api/routerAPI';

export async function syncCorpContacts(provider: MongoProvider, esi: ESI, discordNotifier: DiscordNotifier, channels: Array<AcceptedChannelMongo>, characterId: number, corperation: Corperation): Promise<void> {
    try {
        //Request update from Eve API
        const token: Token = await provider.getToken(characterId, 'esi-contracts.read_corporation_contracts.v1')
        const contracts: CorpContract[] = await getCorpContracts(esi['request'], token, corperation.corperation_id);

        //Remove any contacts that aren't in the original request.
        ContractQueries.removeOldContracts(provider, corperation.corperation_id, contracts);

        for (const contract of contracts) {
            //Compare results with existing
            if (contract.assignee_id != corperation.corperation_id) continue;
            if (!ContractQueries.isNotifiable(provider, corperation.corperation_id, contract)) continue;
            //Post to Discord any notifications
            const message: MessageEmbed = await compileEmbedMessage(esi, corperation, contract);
            discordNotifier.postChannelsMsg(channels, message);
            //Save new results
            ContractQueries.saveOrUpdateContract(provider, corperation.corperation_id, contract);
        }
    } catch (e) {
        console.error(e)
        return null;
    }
}

async function compileEmbedMessage(esi: ESI, corperation: Corperation, contract: CorpContract): Promise<MessageEmbed> {
    const characterPublic: CharacterPublic = await getPublicCharacterInfo(esi['request'], null, contract.issuer_id);
    const embed = new MessageEmbed()
        .setTitle(`New ${contract.type.toString().toUpperCase()} Contract`)
        .setAuthor(`${corperation.name}`, getCorperationIconURL(contract.assignee_id))
        .setColor(blue)
        .setThumbnail(`${ICON_URLS[contract.type.toString()]}`)
        .setDescription(contract.title)
        .setTimestamp(Date.parse(contract.date_issued))
        .addFields(
            { name: 'days to complete:', value: `${contract.days_to_complete}` },
            { name: 'volume:', value: `${contract.volume}` }
        )
        .setFooter(`Issued by ${characterPublic.name}`, getProfilePictureURL(contract.issuer_id));
    switch (contract.type) {
        case IType.auction:
            embed.addFields(
                { name: 'price:', value: `${contract.price}` },
                { name: 'buyout:', value: `${contract.buyout}` }
            )
            break;
        case IType.courier:
            const stationStart: Station = (await getStationInfo(esi['request'], null, contract.start_location_id));
            const stationEnd: Station = (await getStationInfo(esi['request'], null, contract.start_location_id));
            const jumps: number = (await getRouteInfo(esi['request'], null, stationStart.system_id, stationEnd.system_id)).length
            embed.addFields(
                { name: 'reward:', value: `${contract.reward}` },
                { name: 'collateral:', value: `${contract.collateral}` },
                { name: 'start location:', value: `${stationStart.name}` },
                { name: 'end location:', value: `${stationEnd.name}` },
                { name: 'minimum jumps:', value: `${jumps}`}
            )
            break;
        case IType.item_exchange:
            embed.addFields(
                { name: 'price:', value: `${contract.price}` }
            )
            break;
        default:
            break;
    }
    return Promise.resolve(embed);
}

