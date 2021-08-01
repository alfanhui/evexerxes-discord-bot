import { CronJob } from 'cron';
import ESI, { Token } from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider/dist/MongoProvider';
import { getPublicCharacterInfo } from '../api/characterAPI';
import { Corperation, getCorperationInfo } from '../api/corperation/corperationAPI';
import { getCharacterRoles, Roles } from '../api/rolesAPI';
import { AcceptedChannelMongo, DiscordQueries } from '../daos/discordDAO';
import { CharacterMongo, UserQueries } from '../daos/userDAO';
import { syncCorpContacts } from '../handlers/corpContractsHandler';
import { syncFuel } from '../handlers/fuelHandler';
import { syncWar } from '../handlers/warHandler';
import { DiscordNotifier } from '../notifier/discordNotifier';

export class Cron {

    contractJob: CronJob;
    fuelJob: CronJob;
    warJob: CronJob;

    provider: MongoProvider;
    esi: ESI;
    discordNotifier: DiscordNotifier;

    constructor(provider: MongoProvider, esi: ESI, discordNotifier: DiscordNotifier) {
        this.provider = provider;
        this.esi = esi;
        this.discordNotifier = discordNotifier;
        this.contractJob = new CronJob('0 */5 * * * *', async () => {
            try {
                await this.contractScheduler();
            } catch (e) {
                console.error(e);
            }
        });

        this.fuelJob = new CronJob('0 0 */3 * * *', async () => {
            try {
                await this.fuelScheduler();
            } catch (e) {
                console.error(e);
            }
        });

        this.warJob = new CronJob('0 0 */1 * * *', async () => {
            try {
                await this.warScheduler();
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
    }

    async contractScheduler() {
        console.log("Starting ContractScheduler..")
        try {
           //For each character...
           var channels: Array<AcceptedChannelMongo> = await DiscordQueries.getAcceptedChannels(this.provider);
           var characters: CharacterMongo[] = await UserQueries.getCharacters(this.provider);
           characters.forEach(async(character) => {
               //TODO For each authorised method...
               const corperationId: number =  (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
               var corperation: Corperation = await getCorperationInfo(this.esi, null, corperationId);
               corperation.corperation_id = corperationId;

               //CorpContracts
               await syncCorpContacts(this.provider, this.esi, this.discordNotifier, channels, character.characterId, corperation);
           });
           console.log("ContractScheduler finished.")
        } catch (e) {
            console.error(e)
        }
    }


    async warScheduler() {
        console.log("Starting WarScheduler..")
        try {
            //Get higher level calls (character and corperations)
            const channels: Array<AcceptedChannelMongo> = await DiscordQueries.getAcceptedChannels(this.provider);
            const characters: Array<CharacterMongo> = await UserQueries.getCharacters(this.provider);
            var corperationsInOrder: Array<Corperation> = [];
            for (const character of characters) {
                const corperationId: number = (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
                var corperation: Corperation = await getCorperationInfo(this.esi, null, corperationId);
                corperation.corperation_id = corperationId;
                corperationsInOrder.push(corperation);
            };
            await syncWar(this.provider, this.esi, this.discordNotifier, channels, characters, corperationsInOrder);
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
                const corperationId: number = (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
                var corperation: Corperation = await getCorperationInfo(this.esi, null, corperationId);
                corperation.corperation_id = corperationId;

                //CorpStructures // only directors
                const token: Token = await this.provider.getToken(character.characterId, 'esi-characters.read_corporation_roles.v1')
                var roles = (await getCharacterRoles(this.esi, token, character.characterId));
                if (roles.roles.find((role) => role.toString() == Roles[Roles.Station_Manager])) {
                    await syncFuel(this.provider, this.esi, this.discordNotifier, channels, character.characterId, corperation);
                }
            });
            console.log("FuelScheduler finished.")
        } catch (e) {
            console.error(e)
        }
    }




    async bar(): Promise<void> {
        // Do some task
        console.log("hello")
    }
}

