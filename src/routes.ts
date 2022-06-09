import { UserQueries, CharacterMongo, AccountMongo } from './daos/userDAO';
import ESI, { Account, Character, Provider, Token } from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider'
import Router from 'koa-router';
import { CorpStructuresQueries } from './daos/corpStructuresDAO';
import { getPublicCharacterInfo } from './api/characterAPI';
import { CorpContractQueries } from './daos/corpContractDAO';
import { WarsQueries } from './daos/warsDAO';
import { CorpWarsQueries } from './daos/corpWarsDAO';
import { CorpMoonExtractionsQueries } from './daos/corpMoonExtractionDAO';
import { DiscordNotifier } from './notifier/discordNotifier';
import { CorpBlueprintDAOModelQueries } from './daos/corpBlueprintsDAO';
import { CharNotificationsQueries } from './daos/charNotificationsDAO';


const AUTHORISATIONS: Array<string> = [
    "esi-characters.read_corporation_roles.v1",
    "esi-contracts.read_corporation_contracts.v1",
    "esi-corporations.read_blueprints.v1",
    "esi-industry.read_corporation_jobs.v1",
    "esi-corporations.read_structures.v1",
    "esi-industry.read_corporation_mining.v1",
    "esi-planets.read_customs_offices.v1",
    "esi-universe.read_structures.v1",
    "esi-characters.read_notifications.v1"
]


export class Routes {
    router: any;
    provider: MongoProvider;
    esi: ESI;
    discordNotifier: DiscordNotifier;

    constructor(provider: MongoProvider, esi: ESI, discordNotifier: DiscordNotifier) {
        this.provider = provider
        this.esi = esi;
        this.discordNotifier = discordNotifier;
        this.router = new Router();

        this.router.get('/login', (ctx: any) => this.getLogin(ctx));
        this.router.post('/login', (ctx: any) => this.postLoginRedirect(ctx));
        this.router.get('/callback', (ctx: any) => this.getCallback(ctx));
        this.router.get('/delete/account/:accountId', (ctx: any) => this.deleteAccount(ctx));
        this.router.get('/delete/character/:characterId', (ctx: any) => this.deleteCharacter(ctx));
        this.router.get('/wipe', (ctx: any) => this.wipe(ctx));
        this.router.get('/wipe/stations', (ctx: any) => this.wipeStations(ctx));
        this.router.get('/wipe/moon', (ctx: any) => this.wipeMoonExtraction(ctx));
        this.router.get('/wipe/industry', (ctx: any) => this.wipeIndustry(ctx));
    }

    getRouter() {
        return this.router;
    }

    async wipe(ctx: any) {
        try{
            var characters: CharacterMongo[] = await UserQueries.getCharacters(this.provider);
            characters.forEach(async(character) => {
                //TODO For each authorised method...
                const corporationId: number =  (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
                await CorpContractQueries.deleteAll(this.provider, corporationId);
                await CorpStructuresQueries.deleteAll(this.provider, corporationId);
                await CorpWarsQueries.deleteAll(this.provider, corporationId);
                await CorpMoonExtractionsQueries.deleteAll(this.provider, corporationId);
                await CorpBlueprintDAOModelQueries.deleteAll(this.provider, corporationId);
                await CharNotificationsQueries.deleteAll(this.provider, character.characterId);
            });
            await WarsQueries.deleteAll(this.provider);
        }catch(e){
            console.error(e);
        }
        console.log("collections wiped.")
        ctx.body = "<h1>WIPED</h1>"
    }

    async wipeStations(ctx: any){
        try{
            var characters: CharacterMongo[] = await UserQueries.getCharacters(this.provider);
            characters.forEach(async(character) => {
                const corporationId: number =  (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
                await CorpStructuresQueries.deleteAll(this.provider, corporationId);
                await CharNotificationsQueries.deleteAll(this.provider, character.characterId);
            });
        }catch(e){
            console.error(e);
        }
        console.log("station collections wiped.")
        ctx.body = "<h1>STATIONS WIPED</h1>"
    }

    async wipeMoonExtraction(ctx: any){
        try{
            var characters: CharacterMongo[] = await UserQueries.getCharacters(this.provider);
            characters.forEach(async(character) => {
                const corporationId: number =  (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
                await CorpMoonExtractionsQueries.deleteAll(this.provider, corporationId);
            });
        }catch(e){
            console.error(e);
        }
        console.log("moon collections wiped.")
        ctx.body = "<h1>MOON EXTRACTION WIPED</h1>"
    }

    async wipeIndustry(ctx: any){
        try{
            var characters: CharacterMongo[] = await UserQueries.getCharacters(this.provider);
            characters.forEach(async(character) => {
                const corporationId: number =  (await getPublicCharacterInfo(this.esi, null, character.characterId)).corporation_id;
                await CorpBlueprintDAOModelQueries.deleteAll(this.provider, corporationId);
            });
        }catch(e){
            console.error(e);
        }
        console.log("industry collections wiped.")
        ctx.body = "<h1>INDUSTRY WIPED</h1>"
    }

    async getLogin(ctx: any) {
        ctx.body = "<h1>Eve-Xerxes Discord Notifier Bot Logins</h1>"
        ctx.body += await this.initAccountsHTML();
        ctx.body += await this.initCharactersHTML();
        ctx.body += this.initAuthorisationsForm();
        //ctx.body += await this.initChannelTable();
    }

    async initAccountsHTML():Promise<string>{
        let accounts: Array<AccountMongo> = await UserQueries.getAccounts(this.provider);
        var html:string = "<h2>Accounts</h2>";
        if (accounts.length == 0) {
            html += "<i>none</i>"
        } else {
            html += "<table>";
            accounts.forEach(account => {
                html += String.raw`<tr><td>${account.owner}<td><button onclick="location.href ='/delete/account/${account.owner}'">Delete ${account.owner}</button>`
            });
            html += "</table>"
        }
        return html;
    }

    async initCharactersHTML():Promise<string>{
        let characters: Array<CharacterMongo> = await UserQueries.getCharacters(this.provider);
        var html:string = "<h2>Characters</h2>";
        if (characters.length == 0) {
            html += "<i>none</i>";
        } else {
            html += "<table><tr><th>Owner<th>Character Name<th>Character Id<th>Delete";
            characters.forEach(character => {
                html += `<tr><td>${character.owner}<td>${character.characterName}<td>${character.characterId}<td><button onclick="location.href ='/delete/character/${character.characterId}'">Delete ${character.characterName}</button>`
            });
            html += "</table>"
        }
        return html;
    }
    
    initAuthorisationsForm():string{
        var formHMTL:string =  `<hr><h2>New Login</h2><h3>Select Authorisations:</h3><form action='/login' method='post' name='form1'>`;        
        AUTHORISATIONS.forEach((auth, index)=>{
            formHMTL+=`<input type="checkbox" id="auth${index}" name="${auth.replace(/[._]/g, "_")}" value="${auth}" checked="checked">
            <label for="auth${index}">${auth}</label><br>`
        });        
        formHMTL+= `<input type="submit" value="Add new login"></form>`
        return formHMTL;
    }

    initChannelTable():Promise<string>{
        return new Promise(()=>"");
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
        const corporationId: number = (await getPublicCharacterInfo(this.esi, null, newCharacter.character.characterId)).corporation_id;
        await CorpContractQueries.createIndex(this.provider,corporationId);
        await CorpStructuresQueries.createIndex(this.provider,corporationId);
        await CorpWarsQueries.createIndex(this.provider, corporationId);
        await CorpMoonExtractionsQueries.createCollection(this.provider, corporationId);
        await CorpBlueprintDAOModelQueries.createCollection(this.provider, corporationId);
    }
}
