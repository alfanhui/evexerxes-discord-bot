import { CronJob } from 'cron';
import ESI, { Token } from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider/dist/MongoProvider';
import { getPublicCharacterInfo } from '../api/characterAPI';
import { Corporation, getCorporationInfo } from '../api/corporation/corporationAPI';
import { getCharacterRoles, Roles } from '../api/rolesAPI';
import { AcceptedChannelMongo, DiscordQueries } from '../daos/discordDAO';
import { CharacterMongo, UserQueries } from '../daos/userDAO';
import { syncCorpContacts } from '../handlers/corpContractsHandler';
import { syncFuel } from '../handlers/fuelHandler';
import { syncMoonExtraction } from '../handlers/moonExtractionHandler';
import { syncStructureHealth } from '../handlers/structureHealthHandler';
import { syncWar } from '../handlers/warHandler';
import { DiscordNotifier } from '../notifier/discordNotifier';

export class Cron {

    contractJob: CronJob;
    fuelJob: CronJob;
    warJob: CronJob;
    moonExtractionJob: CronJob;
    structureHealthJob: CronJob;

    provider: MongoProvider;
    esi: ESI;
    discordNotifier: DiscordNotifier;

    constructor(provider: MongoProvider, esi: ESI, discordNotifier: DiscordNotifier) {
        this.provider = provider;
        this.esi = esi;
        this.discordNotifier = discordNotifier;
        this.contractJob = new CronJob(process.env.CONTRACT_CRON, async () => {
            try {
                await this.contractScheduler();
            } catch (e) {
                console.error(e);
            }
        });

        this.fuelJob = new CronJob(process.env.FUEL_CRON, async () => {
            try {
                await this.fuelScheduler();
            } catch (e) {
                console.error(e);
            }
        });

        this.warJob = new CronJob(process.env.WAR_CRON, async () => {
            try {
                await this.warScheduler();
            } catch (e) {
                console.error(e);
            }
        });

        this.moonExtractionJob = new CronJob(process.env.MOON_EXTRACTION_CRON, async () => {
            try {
                await this.moonExtractionScheduler();
            } catch (e) {
                console.error(e);
            }
        });

        this.structureHealthJob = new CronJob(process.env.STRUCTURE_HEALTH_CRON, async () => {
            try {
                await this.structureHealthScheduler();
            } catch (e) {
                console.error(e);
            }
        });
        // Start jobs
        if (!this.contractJob.running) {
            this.contractJob.start();
        }
        if (!this.warJob.running) {
            this.warJob.start();
        }
        if (!this.fuelJob.running) {
            this.fuelJob.start();
        }
        if (!this.moonExtractionJob.running) {
            this.moonExtractionJob.start();
        }
        if(!this.structureHealthJob.running){
            this.structureHealthJob.start();
        }
    }

    async contractScheduler() {
        console.log("Starting ContractScheduler..")
        try {
           //For each character...
           var channels: Array<AcceptedChannelMongo> = await DiscordQueries.getAcceptedChannels(this.provider);
           var characters: CharacterMongo[] = await UserQueries.getCharacters(this.provider);
           characters.forEach(async(character) => {
               //TODO For each authorised method...
               const corporationId: number =  (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
               var corporation: Corporation = await getCorporationInfo(this.esi, null, corporationId);
               corporation.corporation_id = corporationId;

               //CorpContracts
               await syncCorpContacts(this.provider, this.esi, this.discordNotifier, channels, character.characterId, corporation);
           });
           console.log("ContractScheduler finished.")
        } catch (e) {
            console.error(e)
        }
    }


    async warScheduler() {
        console.log("Starting WarScheduler..")
        try {
            //Get higher level calls (character and corporations)
            const channels: Array<AcceptedChannelMongo> = await DiscordQueries.getAcceptedChannels(this.provider);
            const characters: Array<CharacterMongo> = await UserQueries.getCharacters(this.provider);
            var corporationsInOrder: Array<Corporation> = [];
            for (const character of characters) {
                const corporationId: number = (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
                var corporation: Corporation = await getCorporationInfo(this.esi, null, corporationId);
                corporation.corporation_id = corporationId;
                corporationsInOrder.push(corporation);
            };
            await syncWar(this.provider, this.esi, this.discordNotifier, channels, characters, corporationsInOrder);
            console.log("WarScheduler finished.")
        } catch (e) {
            console.error(e)
        }
    }

    async fuelScheduler() {
        console.log("Starting FuelScheduler..")
        try {
            //For each character...
            var channels: Array<AcceptedChannelMongo> = await DiscordQueries.getAcceptedChannels(this.provider);
            var characters: CharacterMongo[] = await UserQueries.getCharacters(this.provider);
            characters.forEach(async (character) => {
                //TODO For each authorised method...
                const corporationId: number = (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
                var corporation: Corporation = await getCorporationInfo(this.esi, null, corporationId);
                corporation.corporation_id = corporationId;

                //CorpStructures // only directors
                const token: Token = await this.provider.getToken(character.characterId, 'esi-characters.read_corporation_roles.v1')
                var roles = (await getCharacterRoles(this.esi, token, character.characterId));
                if (roles.roles.find((role) => role.toString() == Roles[Roles.Station_Manager])) {
                    await syncFuel(this.provider, this.esi, this.discordNotifier, channels, character.characterId, corporation);
                }
            });
            console.log("FuelScheduler finished.")
        } catch (e) {
            console.error(e)
        }
    }

    async moonExtractionScheduler() {
        console.log("Starting MoonExtractionScheduler..")
        try {
            //For each character...
            var channels: Array<AcceptedChannelMongo> = await DiscordQueries.getAcceptedChannels(this.provider);
            var characters: CharacterMongo[] = await UserQueries.getCharacters(this.provider);
            characters.forEach(async (character) => {
                //TODO For each authorised method...
                const corporationId: number = (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
                var corporation: Corporation = await getCorporationInfo(this.esi, null, corporationId);
                corporation.corporation_id = corporationId;

                //CorpMoonExtractors // only directors
                const token: Token = await this.provider.getToken(character.characterId, 'esi-characters.read_corporation_roles.v1')
                var roles = (await getCharacterRoles(this.esi, token, character.characterId));
                if (roles.roles.find((role) => role.toString() == Roles[Roles.Station_Manager])) {
                    await syncMoonExtraction(this.provider, this.esi, this.discordNotifier, channels, character.characterId, corporation);
                }
            });
            console.log("MoonExtractionScheduler finished.")
        } catch (e) {
            console.error(e)
        }
    }

    async structureHealthScheduler() {
        console.log("Starting StuctureHealthScheduler..")
        try {
            //For each character...
            var channels: Array<AcceptedChannelMongo> = await DiscordQueries.getAcceptedChannels(this.provider);
            var characters: CharacterMongo[] = await UserQueries.getCharacters(this.provider);
            characters.forEach(async (character) => {
                //TODO For each authorised method...
                const corporationId: number = (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
                var corporation: Corporation = await getCorporationInfo(this.esi, null, corporationId);
                corporation.corporation_id = corporationId;

                //CorpStructures // only directors
                const token: Token = await this.provider.getToken(character.characterId, 'esi-characters.read_corporation_roles.v1')
                var roles = (await getCharacterRoles(this.esi, token, character.characterId));
                if (roles.roles.find((role) => role.toString() == Roles[Roles.Station_Manager])) {
                    await syncStructureHealth(this.provider, this.esi, this.discordNotifier, channels, character.characterId, corporation);
                }
            });
            console.log("StuctureHealthScheduler finished.")
        } catch (e) {
            console.error(e)
        }
    }

}


