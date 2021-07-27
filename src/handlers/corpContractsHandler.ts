import ESI, { Token } from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider';
import { CharacterPublic, getPublicCharacterInfo } from '../api/characterAPI';
import { Contract, getCorpContracts, IType } from '../api/corperation/contractsAPI';
import { ContractQueries } from "../daos/contractDAO";
import { blue, DiscordNotifier } from '../notifier/discordNotifier';
import { MessageEmbed } from 'discord.js';
import { AcceptedChannelMongo } from '../daos/discordDAO';
import { Corperation } from '../api/corperation/corperationAPI';
import { getCorperationIconURL, getProfilePictureURL, ICON_URLS } from '../data/images';
import { getStationInfo, Station } from '../api/stationAPI';
import { getRouteInfo } from '../api/routerAPI';
import { abbreviateNumber } from '../utils/numbers';
import { getStructureInfo, Structure } from '../api/structureAPI';

const ContractType: {[key:string]: string} = {
    unknown: 'Unknown',
    item_exchange: 'Item Exchange',
    auction: 'Auction',
    courier: 'Courier',
    loan: 'Loan'
}

export async function syncCorpContacts(provider: MongoProvider, esi: ESI, discordNotifier: DiscordNotifier, channels: Array<AcceptedChannelMongo>, characterId: number, corperation: Corperation): Promise<void> {
    try {
        //Request update from Eve API
        const token: Token = await provider.getToken(characterId, 'esi-contracts.read_corporation_contracts.v1')
        const contracts: Array<Contract> = await getCorpContracts(esi, token, corperation.corperation_id);

        //Remove any contacts that aren't in the original request.
        ContractQueries.removeOldContracts(provider, corperation.corperation_id, contracts);

        for (const contract of contracts) {
            //Compare results with existing
            if (contract.assignee_id != corperation.corperation_id) continue;
            if (!await ContractQueries.isNotifiable(provider, corperation.corperation_id, contract)) continue;
            //Post to Discord any notifications
            const message: MessageEmbed = await compileEmbedMessage(esi, corperation, token, contract);
            discordNotifier.postChannelsMsg(channels, message);
            //Save new results
            ContractQueries.saveOrUpdateContract(provider, corperation.corperation_id, contract);
        }
    } catch (e) {
        console.error(e)
        return null;
    }
}

async function compileEmbedMessage(esi: ESI, corperation: Corperation, token: Token, contract: Contract): Promise<MessageEmbed> {
    const characterPublic: CharacterPublic = await getPublicCharacterInfo(esi, null, contract.issuer_id);
    var structureStart: Structure = null;
    var stationStart: Station = null;
    if(contract.start_location_id > 1000000000000){
        structureStart = (await getStructureInfo(esi, token, contract.start_location_id));
    }else{
        stationStart = (await getStationInfo(esi, null, contract.start_location_id));
    }
    const embed = new MessageEmbed()
        .setAuthor(`${corperation.name}`, getCorperationIconURL(contract.assignee_id))
        .setTitle(`New ${ContractType[contract.type]} Contract`)
        .setColor(blue)
        .setThumbnail(`${ICON_URLS[`contract_${contract.type}`]}`)
        .setDescription(contract.title)
        .setTimestamp(Date.parse(contract.date_issued))
        .addFields(
            { name: 'status:', value: `${contract.status}`, inline: true },
            { name: 'volume:', value: `${Number(contract.volume).toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} m³`, inline: true }
        )
        .setFooter(`Issued by ${characterPublic.name}`, getProfilePictureURL(contract.issuer_id));
    switch (contract.type.toString()) {
        case IType[IType.auction]:
            embed.addFields(
                { name: 'price:', value: `${abbreviateNumber(contract.price)} ISK`, inline: true },
                { name: 'location:', value: `${stationStart ? stationStart.name : structureStart.name}` },
                { name: 'buyout:', value: `${contract.buyout}` }
            )
            break;
        case IType[IType.courier]:
            var structureEnd: Structure = null;
            var stationEnd: Station = null;
            if(contract.end_location_id > 1000000000000){
                structureEnd = (await getStructureInfo(esi, token, contract.start_location_id));
            }else{
                stationEnd = (await getStationInfo(esi, null, contract.start_location_id));
            }
            const jumps: number = (await getRouteInfo(esi, null, (stationStart)? stationStart.system_id : structureStart.solar_system_id, (stationEnd)? stationEnd.system_id : structureEnd.solar_system_id)).length
            embed.addFields(
                { name: 'reward:', value: `${abbreviateNumber(contract.reward)} ISK`, inline: true},
                { name: 'start location:', value: `${stationStart ? stationStart.name : structureStart.name}` },
                { name: 'end location:', value: `${stationEnd ? stationEnd.name : structureEnd.name}` },
                { name: 'minimum jumps:', value: `${jumps}`, inline: true},
                { name: 'collateral:', value: `${abbreviateNumber(contract.collateral)} ISK`, inline: true },
                { name: 'days to complete:', value: `${contract.days_to_complete}`},
            )
            break;
        case IType[IType.item_exchange]:
            const structure: Structure = (await getStructureInfo(esi, token, contract.start_location_id));    
            embed.addFields(
                { name: 'price:', value: `${abbreviateNumber(contract.price)} ISK`, inline: true },
                { name: 'location:', value: `${stationStart ? stationStart.name : structureStart.name}` },
            )
            break;
        default:
            break;
    }
    return Promise.resolve(embed);
}

