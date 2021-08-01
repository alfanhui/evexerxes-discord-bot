import { CharacterMongo, UserQueries } from '../daos/userDAO';
import MongoProvider from 'eve-esi-client-mongo-provider';
import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler';
import ESI, { Token } from 'eve-esi-client';
import { DiscordNotifier } from '../notifier/discordNotifier';
import { AcceptedChannelMongo, DiscordQueries } from '../daos/discordDAO';
import { Corperation, getCorperationInfo } from '../api/corperation/corperationAPI';
import { getPublicCharacterInfo } from '../api/characterAPI';
import { syncFuel } from '../handlers/fuelHandler';
import { getCharacterRoles, Roles } from '../api/rolesAPI';

export class HoursScheduler {
    scheduler = new ToadScheduler();
    job: SimpleIntervalJob;
    INVERVAL = 1800; //every 3 hours
    provider: MongoProvider;
    esi: ESI;
    discordNotifier: DiscordNotifier;

    constructor(provider: MongoProvider, esi: ESI, discordNotifier: DiscordNotifier) {
        this.provider = provider;
        this.esi = esi;
        this.discordNotifier = discordNotifier;
        const task = new AsyncTask(
            'Hours Task',
            () => { return this.task(); },
            (err: Error) => { console.error(err); }
        )
        this.job = new SimpleIntervalJob({ seconds: this.INVERVAL, }, task)
        this.scheduler.addSimpleIntervalJob(this.job)
        console.debug(`Hour Scheduler created, interval: ${this.INVERVAL}`)
    }

    async task() {
        try{
            //For each character...
            var channels: Array<AcceptedChannelMongo> = await DiscordQueries.getAcceptedChannels(this.provider);
            var characters: CharacterMongo[] = await UserQueries.getCharacters(this.provider);
            characters.forEach(async(character) => {
                //TODO For each authorised method...
                const corperationId: number =  (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
                var corperation: Corperation = await getCorperationInfo(this.esi, null, corperationId);
                corperation.corperation_id = corperationId;

                //CorpStructures // only directors
                const token: Token = await this.provider.getToken(character.characterId, 'esi-characters.read_corporation_roles.v1')
                var roles = (await getCharacterRoles(this.esi, token, character.characterId));
                if(roles.roles.find((role) => role.toString() == Roles[Roles.Station_Manager])){
                    await syncFuel(this.provider, this.esi, this.discordNotifier, channels, character.characterId, corperation);
                }
            });
        }catch(e){
            console.log(e)
        }
    }

    // when stopping your app
    //scheduler.stop()
}