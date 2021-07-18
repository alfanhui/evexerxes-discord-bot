import { CorpContract, IStatus, IType } from './api/corpContractsAPI';
import { ContractQueries } from './db/contractQueries';
import { UserQueries, CharacterMongo } from './db/userQueries';
import ESI from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider'
import Router from 'koa-router';

export class Routes {
    router: any;
    provider: MongoProvider;
    esi: ESI;

    constructor(provider: MongoProvider, esi: ESI) {
        this.provider = provider
        this.esi = esi;
        this.router = new Router();

        this.router.get('/login', (ctx: any) => this.getLogin(ctx));
        this.router.get('/test', (ctx: any) => this.getTest(ctx));
        this.router.post('/login', (ctx: any) => this.postLoginRedirect(ctx));
        this.router.get('/callback', (ctx: any) => this.getCallback(ctx));
        this.router.get('/delete/account/:accountId', (ctx: any) => this.deleteAccount(ctx));
        this.router.get('/delete/character/:characterId', (ctx: any) => this.deleteCharacter(ctx));
    }

    getRouter() {
        return this.router;
    }

    async getLogin(ctx: any) {
        ctx.body = "<h1>Eve-Xerxes Discord Notifier Bot Logins</h1>"
        let accounts: Array<string> = await UserQueries.getAccounts(this.provider);
        ctx.body += "<h2>Accounts</h2>";
        if (accounts.length == 0) {
            ctx.body += "<i>none</i>"
        } else {
            ctx.body += "<table>";
            accounts.forEach(account => {
                ctx.body += String.raw`<tr><td>${account}<td><button onclick="location.href ='/delete/account/${account}'">Delete ${account}</button>`
            });
            ctx.body += "</table>"
        }
        let characters: Array<CharacterMongo> = await UserQueries.getCharacters(this.provider);
        ctx.body += "<h2>Characters</h2>";
        if (characters.length == 0) {
            ctx.body += "<i>none</i>";
        } else {
            ctx.body += "<table><tr><th>Owner<th>Character Name<th>Character Id<th>Delete";
            characters.forEach(character => {
                ctx.body += `<tr><td>${character.owner}<td>${character.characterName}<td>${character.characterId}<td><button onclick="location.href ='/delete/character/${character.characterId}'">Delete ${character.characterName}</button>`
            });
            ctx.body += "</table>"
        }
        ctx.body += `<hr><h2>New Login</h2><h3>Select Authorisations:</h3><form action='/login'  method='post' name='form1'>
            <input type="checkbox" id="auth1" name="read_blueprints" value="esi-corporations.read_blueprints.v1" checked="checked">
            <label for="auth1">esi-corporations.read_blueprints.v1</label><br>
            <input type="checkbox" id="auth2" name="read_structures" value="esi-corporations.read_structures.v1" checked="checked">
            <label for="auth2">esi-corporations.read_structures.v1</label><br>
            <input type="checkbox" id="auth3" name="read_customs_offices" value="esi-planets.read_customs_offices.v1" checked="checked">
            <label for="auth3">esi-planets.read_customs_offices.v1</label><br>
            <input type="checkbox" id="auth4" name="read_corporation_contracts" value="esi-contracts.read_corporation_contracts.v1" checked="checked">
            <label for="auth4">esi-contracts.read_corporation_contracts.v1</label><br>
            <input type="submit" value="Add new login">
            </form>`
    }

    async getTest(ctx: any) {
        console.log(ctx);
        ctx.body = "<h1>Test Page</h1>";

        // var corpContact: CorpContract = {
        //     acceptor_id: null,
        //     assignee_id: null,
        //     availability: null,
        //     buyout: 0,
        //     collateral: 0,
        //     contract_id: 12345,
        //     date_accepted: "monday",
        //     date_completed: "tuesday",
        //     date_expired: "wednesday",
        //     date_issued: "sunday",
        //     days_to_complete: 3,
        //     end_location_id: 6969,
        //     for_corporation: false,
        //     issuer_corporation_id: 98176669,
        //     issuer_id: 2115057016,
        //     price: 1000000,
        //     reward: null,
        //     start_location_id: null,
        //     status: IStatus.in_progress,
        //     title: "ore",
        //     type: IType.item_exchange,
        //     volume: 5000
        // }
        // ContractQueries.saveContact(this.provider, 98176669, corpContact);

        // this.provider.createAccount("user1");
        // this.provider.createCharacter("user1", 2115057016, "Florin Flynn");
        // this.provider.createAccount("user2");
        // this.provider.createCharacter("user2", 2118131516, "Tron Takeo");
    }

    async postLoginRedirect(ctx: any) {
        const authorisations: string[] = Object.values(ctx.request.body);
        const redirectUrl = this.esi.getRedirectUrl('some-state', authorisations);
        ctx.redirect(redirectUrl)
    }

    async getCallback(ctx: any) {
        const code = String(ctx.query.code);
        await this.esi.register(code);
        ctx.res.statusCode = 302;
        ctx.res.setHeader('Location', `/login`);
    }

    async deleteAccount(ctx: any) {
        const accountId: string = ctx.params.accountId
        await this.provider.deleteAccount(accountId);
        ctx.redirect("/login")
    }

    async deleteCharacter(ctx: any) {
        const characterId: number = ctx.params.characterId
        await this.provider.deleteCharacter(characterId);
        ctx.redirect("/login")
    }
}