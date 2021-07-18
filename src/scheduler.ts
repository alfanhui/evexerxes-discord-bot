import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler';

export class Scheduler {
    scheduler = new ToadScheduler();
    job: SimpleIntervalJob;
    INVERVAL = 5;
    constructor() {
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
        //TODO GET EVE API
        //TODO Compare results with existing
        //TODO Post to Discord any notifications
        //TODO Save new results
    }

    // when stopping your app
    //scheduler.stop()
}