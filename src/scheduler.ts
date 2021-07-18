import { CharacterMongo, UserQueries } from './db/userQueries';
import { Character } from './../dist/db/databaseQueries.d';
import { CharacterPublic, getPublicCharacterInfo } from './api/characterAPI';
import MongoProvider from 'eve-esi-client-mongo-provider';
import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler';
import ESI, { Token } from 'eve-esi-client';

export class Scheduler {
    scheduler = new ToadScheduler();
    job: SimpleIntervalJob;
    INVERVAL = 5;
    provider: MongoProvider;
    esi: ESI;
    constructor(provider: MongoProvider, esi: ESI) {
        this.provider = provider;
        this.esi = esi;
        const task = new AsyncTask(
            'Pull EVE API',
            () => { return this.task(); },
            (err: Error) => { console.error(err); }
        )
        this.job = new SimpleIntervalJob({ seconds: this.INVERVAL, }, task)
        this.scheduler.addSimpleIntervalJob(this.job)
        console.debug(`Scheduler created, interval: ${this.INVERVAL}`)
    }

    async task() {
        //TODO For each character...
        const Character: CharacterMongo[] = await UserQueries.getCharacters(this.provider);
        //TODO For each authorised method...
        //TODO Call authorised method
    }

    // when stopping your app
    //scheduler.stop()
}