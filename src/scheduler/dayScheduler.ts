import { CharacterMongo, UserQueries } from '../daos/userDAO';
import MongoProvider from 'eve-esi-client-mongo-provider';
import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler';
import ESI from 'eve-esi-client';
import { DiscordNotifier } from '../notifier/discordNotifier';
import { AcceptedChannelMongo, DiscordQueries } from '../daos/discordDAO';
import { Corperation, getCorperationInfo } from '../api/corperation/corperationAPI';
import { getPublicCharacterInfo } from '../api/characterAPI';
import { syncWar } from '../handlers/warHandler';

export class DayScheduler {
    scheduler = new ToadScheduler();
    job: SimpleIntervalJob;
    INVERVAL = 3600; //every half a day
    provider: MongoProvider;
    esi: ESI;
    discordNotifier: DiscordNotifier;

    constructor(provider: MongoProvider, esi: ESI, discordNotifier: DiscordNotifier) {
        this.provider = provider;
        this.esi = esi;
        this.discordNotifier = discordNotifier;
        const task = new AsyncTask(
            'Day Task',
            () => { return this.task(); },
            (err: Error) => { console.error(err); }
        )
        this.job = new SimpleIntervalJob({ seconds: this.INVERVAL, }, task)
        this.scheduler.addSimpleIntervalJob(this.job)
        console.debug(`Day Scheduler created, interval: ${this.INVERVAL}`)
    }

    async task() {
        try{
            //Get higher level calls (character and corperations)
            const channels: Array<AcceptedChannelMongo> = await DiscordQueries.getAcceptedChannels(this.provider);
            const characters: Array<CharacterMongo> = await UserQueries.getCharacters(this.provider);
            var corperationsInOrder: Array<Corperation> = [];
            for(const character of characters){
                const corperationId: number = (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
                var corperation: Corperation = await getCorperationInfo(this.esi, null, corperationId);
                corperation.corperation_id = corperationId;
                corperationsInOrder.push(corperation);
            };
            syncWar(this.provider, this.esi, this.discordNotifier, channels, characters, corperationsInOrder);
        }catch(e){
            console.log(e)
        }
    }

    // when stopping your app
    //scheduler.stop()
}