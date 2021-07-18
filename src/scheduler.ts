import { CharacterMongo, UserQueries } from './db/userQueries';
import MongoProvider from 'eve-esi-client-mongo-provider';
import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler';
import ESI from 'eve-esi-client';
import { syncCorpContacts } from './handlers/corpContractsHandler';
import { CorpContract } from './api/corpContractsAPI';
import { ContractQueries } from './db/contractQueries';

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
        var characters: CharacterMongo[] = await UserQueries.getCharacters(this.provider);
        characters.forEach((character) => {
            //syncCorpContacts(this.provider, this.esi, character.characterId);
        });

        var corpContracts: Array<CorpContract> = await ContractQueries.getContracts(this.provider, 98176669);
        console.log("length" + corpContracts.length)
        corpContracts.forEach((corpContract) =>
            console.log(corpContract)
        );
        //TODO For each authorised method...
        //TODO Call authorised method
    }

    // when stopping your app
    //scheduler.stop()
}