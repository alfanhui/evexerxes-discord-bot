import { CronJob } from 'cron';
import ESI, { Token } from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider/dist/MongoProvider';
import { getPublicCharacterInfo } from '../api/characterAPI';
import { Corporation, getCorporationInfo } from '../api/corporation/corporationAPI';
import { getCharacterRoles, Roles } from '../api/rolesAPI';
import { AcceptedChannelMongo, DiscordQueries } from '../daos/discordDAO';
import { CharacterMongo, UserQueries } from '../daos/userDAO';
import { syncCorpContacts } from '../handlers/corpContractsHandler';
import { syncCorpIndustry } from '../handlers/corpIndustryHandler';
import { syncCorpIndustryNotifierHandler } from '../handlers/corpIndustryNotifierHandler';
import { syncFuel } from '../handlers/fuelHandler';
import { syncMoonExtraction } from '../handlers/moonExtractionHandler';
import { syncStructureHealth } from '../handlers/structureHealthHandler';
import { syncCharNotifications } from '../handlers/charNotificationsHandler';
import { syncWar } from '../handlers/warHandler';
import { DiscordNotifier } from '../notifier/discordNotifier';

export class Cron {

    contractJob: CronJob;
    fuelJob: CronJob;
    warJob: CronJob;
    moonExtractionJob: CronJob;
    structureHealthJob: CronJob;
    charNotifJob: CronJob;
    industryJob: CronJob;
    industryNotifierJob: CronJob;

    provider: MongoProvider;
    esi: ESI;
    discordNotifier: DiscordNotifier;

    constructor(provider: MongoProvider, esi: ESI, discordNotifier: DiscordNotifier) {
        this.provider = provider;
        this.esi = esi;
        this.discordNotifier = discordNotifier;
        if (process.env.CONTRACT_CRON) {
            this.contractJob = new CronJob(process.env.CONTRACT_CRON, async () => {
                try {
                    await this.contractScheduler();
                } catch (e) {
                    console.error(e);
                }
            });
            if (!this.contractJob.running) {
                this.contractJob.start();
            }
        }

        if (process.env.FUEL_CRON) {
            this.fuelJob = new CronJob(process.env.FUEL_CRON, async () => {
                try {
                    await this.fuelScheduler();
                } catch (e) {
                    console.error(e);
                }
            });
            if (!this.fuelJob.running) {
                this.fuelJob.start();
            }
        }

        if (process.env.WAR_CRON) {
            this.warJob = new CronJob(process.env.WAR_CRON, async () => {
                try {
                    await this.warScheduler();
                } catch (e) {
                    console.error(e);
                }
            });
            if (!this.warJob.running) {
                this.warJob.start();
            }
        }

        if (process.env.MOON_EXTRACTION_CRON) {
            this.moonExtractionJob = new CronJob(process.env.MOON_EXTRACTION_CRON, async () => {
                try {
                    await this.moonExtractionScheduler();
                } catch (e) {
                    console.error(e);
                }
            });
            if (!this.moonExtractionJob.running) {
                this.moonExtractionJob.start();
            }
        }

        if (process.env.STRUCTURE_HEALTH_CRON) {
            this.structureHealthJob = new CronJob(process.env.STRUCTURE_HEALTH_CRON, async () => {
                try {
                    await this.structureHealthScheduler();
                } catch (e) {
                    console.error(e);
                }
            });
            if (!this.structureHealthJob.running) {
                this.structureHealthJob.start();
            }
        }

        if(process.env.CHAR_NOTIFICATION_CRON) {
            this.charNotifJob = new CronJob(process.env.CHAR_NOTIFICATION_CRON, async () => {
                try {
                    await this.charNotificationsScheduler();
                } catch (e) {
                    console.error(e);
                }
            });
            if (!this.charNotifJob.running) {
                this.charNotifJob.start();
            }
        }
        
        if (process.env.INDUSTRY_CRON) {
            this.industryJob = new CronJob(process.env.INDUSTRY_CRON, async () => {
                try {
                    await this.industryScheduler();
                } catch (e) {
                    console.error(e);
                }
            });
            if (!this.industryJob.running) {
                this.industryJob.start();
            }
        }

        if (process.env.INDUSTRY_NOTIFIER_CRON) {
            this.industryNotifierJob = new CronJob(process.env.INDUSTRY_NOTIFIER_CRON, async () => {
                try {
                    await this.industryNotifierScheduler();
                } catch (e) {
                    console.error(e);
                }
            });
            if (!this.industryNotifierJob.running) {
                this.industryNotifierJob.start();
            }
        }
    }

    async contractScheduler() {
        console.log("Starting ContractScheduler..")
        try {
            //For each character...
            var channels: Array<AcceptedChannelMongo> = await DiscordQueries.getAcceptedChannels(this.provider);
            var characters: CharacterMongo[] = await UserQueries.getCharacters(this.provider);
            characters.forEach(async (character) => {
                //TODO For each authorised method...
                const corporationId: number = (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
                var corporation: Corporation = await getCorporationInfo(this.esi, null, corporationId);
                corporation.corporation_id = corporationId;

                //CorpContracts
                await syncCorpContacts(this.provider, this.esi, this.discordNotifier, channels, character.characterId, corporation);
            });
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
        } catch (e) {
            console.error(e)
        }
    }

    async charNotificationsScheduler() {
        console.log("Starting CharacterNotificationsScheduler")
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
                    await syncCharNotifications(this.provider, this.esi, this.discordNotifier, channels, character.characterId, corporation);
                }
            });
        } catch (e) {
            console.error(e)
        }
    }

    async structureHealthScheduler() {
        console.log("Starting StructureHealthScheduler..")
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
        } catch (e) {
            console.error(e)
        }
    }


    async industryScheduler() {
        console.log("Starting IndustryScheduler..")
        try {
            //For each character...
            var characters: CharacterMongo[] = await UserQueries.getCharacters(this.provider);
    
            characters.forEach(async (character) => {
                //TODO For each authorised method...
                const corporationId: number = (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
                var corporation: Corporation = await getCorporationInfo(this.esi, null, corporationId);
                corporation.corporation_id = corporationId;

                //CorpIndustry // only directors
                const token: Token = await this.provider.getToken(character.characterId, 'esi-characters.read_corporation_roles.v1')
                var roles = (await getCharacterRoles(this.esi, token, character.characterId));
                if (roles.roles.find((role) => role.toString() == Roles[Roles.Factory_Manager])) {
                    await syncCorpIndustry(this.provider, this.esi, character.characterId, corporation);
                }
            });
        } catch (e) {
            console.error(e)
        }
    }

    async industryNotifierScheduler() {
        console.log("Starting IndustryNotifierScheduler..")
        try {
            //For each character...
            var channels: Array<AcceptedChannelMongo> = await DiscordQueries.getAcceptedChannels(this.provider);
            var characters: CharacterMongo[] = await UserQueries.getCharacters(this.provider);
    
            characters.forEach(async (character) => {
                //TODO For each authorised method...
                const corporationId: number = (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
                var corporation: Corporation = await getCorporationInfo(this.esi, null, corporationId);
                corporation.corporation_id = corporationId;

                //CorpIndustry // only directors
                const token: Token = await this.provider.getToken(character.characterId, 'esi-characters.read_corporation_roles.v1')
                var roles = (await getCharacterRoles(this.esi, token, character.characterId));
                if (roles.roles.find((role) => role.toString() == Roles[Roles.Director])) {
                    await syncCorpIndustryNotifierHandler(this.provider, this.discordNotifier, channels, corporation);
                }
            });
        } catch (e) {
            console.error(e)
        }
    }
}


