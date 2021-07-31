import { UserQueries, CharacterMongo, AccountMongo } from './daos/userDAO';
import ESI, { Account, Character, Provider, Token } from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider'
import Router from 'koa-router';
import { CorpStructuresQueries } from './daos/corpStructuresDAO';
import { getPublicCharacterInfo } from './api/characterAPI';
import { ContractQueries } from './daos/contractDAO';

export class Routes {
    router: any;
    provider: MongoProvider;
    esi: ESI;

    constructor(provider: MongoProvider, esi: ESI) {
        this.provider = provider
        this.esi = esi;
        this.router = new Router();

        this.router.get('/login', (ctx: any) => this.getLogin(ctx));
        this.router.post('/login', (ctx: any) => this.postLoginRedirect(ctx));
        this.router.get('/callback', (ctx: any) => this.getCallback(ctx));
        this.router.get('/delete/account/:accountId', (ctx: any) => this.deleteAccount(ctx));
        this.router.get('/delete/character/:characterId', (ctx: any) => this.deleteCharacter(ctx));
        this.router.get('/wipe', (ctx: any) => this.wipe(ctx));
    }

    getRouter() {
        return this.router;
    }

    async wipe(ctx: any) {
        await ContractQueries.deleteAll(this.provider, 98176669);
        await CorpStructuresQueries.deleteAll(this.provider, 98662212);
        console.log("collections wiped.")
        ctx.body = "<h1>WIPED</h1>"
    }

    async getLogin(ctx: any) {
        ctx.body = "<h1>Eve-Xerxes Discord Notifier Bot Logins</h1>"
        let accounts: Array<AccountMongo> = await UserQueries.getAccounts(this.provider);
        ctx.body += "<h2>Accounts</h2>";
        if (accounts.length == 0) {
            ctx.body += "<i>none</i>"
        } else {
            ctx.body += "<table>";
            accounts.forEach(account => {
                ctx.body += String.raw`<tr><td>${account.owner}<td><button onclick="location.href ='/delete/account/${account.owner}'">Delete ${account.owner}</button>`
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
            <input type="checkbox" id="auth2" name="read_corp_structures" value="esi-corporations.read_structures.v1" checked="checked">
            <label for="auth2">esi-corporations.read_structures.v1</label><br>
            <input type="checkbox" id="auth3" name="read_character_roles" value="esi-characters.read_corporation_roles.v1" checked="checked">
            <label for="auth3"esi-characters.read_corporation_roles.v1</label><br>
            <input type="checkbox" id="auth4" name="read_customs_offices" value="esi-planets.read_customs_offices.v1" checked="checked">
            <label for="auth4">esi-planets.read_customs_offices.v1</label><br>
            <input type="checkbox" id="auth5" name="read_corporation_contracts" value="esi-contracts.read_corporation_contracts.v1" checked="checked">
            <label for="auth5">esi-contracts.read_corporation_contracts.v1</label><br>
            <input type="checkbox" id="auth6" name="read_structures" value="esi-universe.read_structures.v1" checked="checked">
            <label for="auth6">esi-universe.read_structures.v1</label><br>
            <input type="submit" value="Add new login">
            </form>`
    }

    async postLoginRedirect(ctx: any) {
        const authorisations: string[] = Object.values(ctx.request.body);
        const redirectUrl = this.esi.getRedirectUrl('some-state', authorisations);
        ctx.redirect(redirectUrl)
    }

    async getCallback(ctx: any) {
        const code = String(ctx.query.code);
        const newCharacter: {
            account: Account,
            character: Character,
            token: Token
         } = await this.esi.register(code);
        this.setupDatabaseIndexes(newCharacter);
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

    async setupDatabaseIndexes(newCharacter: { account: Account; character: Character; token: Token;}){
        const corperationId: number = (await getPublicCharacterInfo(this.esi, null, newCharacter.character.characterId)).corporation_id;
        await ContractQueries.createIndex(this.provider,corperationId);
        await CorpStructuresQueries.createIndex(this.provider,corperationId);
    }
}
