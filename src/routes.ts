import Router from 'koa-router';
export class Routes {
    router: any;

    constructor(getUser: Function, getCallback: Function, getWelcome: Function) {
        this.router = new Router();
        this.router.get('/login/:user', getUser);
        this.router.get('/callback', getCallback);
        this.router.get('/welcome/:characterId', getWelcome);
    }

    getRouter() {
        return this.router;
    }
}