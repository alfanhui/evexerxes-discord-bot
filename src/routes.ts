import { DatabaseQueries } from './db/databaseQueries';
import ESI from 'eve-esi-client';
import MongoProvider from 'eve-esi-client-mongo-provider'
import Router from 'koa-router';
import { CLIENT_ID, SECRET } from "./secret.js";
import { CorpContracts, getCorpContracts, IStatus } from "./api/corpContracts.js";
import { CHARACTERS_BY_ID, CHARACTERS_BY_NAME } from "./data/characters.js";


export class Routes {
    router: any;
    provider = new MongoProvider('mongodb://localhost/esi', {
        connectionOptions: {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    })
    esi: ESI;
    CALLBACK_URI = 'https://www.garbagecollectorb.com/callback';

    constructor() {
        this.router = new Router();
        this.esi = new ESI({
            provider: this.provider,
            clientId: CLIENT_ID,
            secretKey: SECRET,
            callbackUri: this.CALLBACK_URI
        });
        this.router.get('/login', (ctx: any) => this.getLogin(ctx));
        this.router.get('/login/:user', (ctx: any) => this.getUser(ctx));
        this.router.get('/callback', this.getCallback);
        this.router.get('/welcome/:characterId', this.getWelcome);
    }

    getRouter() {
        return this.router;
    }

    async getLogin(ctx: any) {
        let accounts: Array<string> = await DatabaseQueries.getAccounts(this.provider);
        ctx.body = "<h1>Accounts</h1>";
        accounts.forEach(account => {
            ctx.body += `<p>${account}<\p>`
        });
        let characters: Array<string> = await DatabaseQueries.getCharacters(this.provider);
        ctx.body += "<h1>Characters</h1>";
        characters.forEach(character => {
            ctx.body += `<p>${character}<\p>`
        });
    }

    async getUser(ctx: any) {
        const user_id: number = CHARACTERS_BY_NAME[ctx.params.user]
        this.provider.createAccount(user_id.toString())
        if (user_id == null) {
            ctx.body = `Invalid user: ${ctx.params.user}`
        } else {
            const redirectUrl = this.esi.getRedirectUrl('some-state', CHARACTERS_BY_ID[user_id].authorisations);
            ctx.body = `<a href="${redirectUrl}">Log in using Eve Online</a>`;
        }
    }

    async getCallback(ctx: any) {
        const code = String(ctx.query.code);
        const { character } = await this.esi.register(code);

        ctx.res.statusCode = 302;
        ctx.res.setHeader('Location', `/welcome/${character.characterId}`);
    }


    async getWelcome(ctx: any) {
        const characterId = Number(ctx.params.characterId)
        const character = await this.provider.getCharacter(characterId)
        const token = await this.provider.getToken(characterId, 'esi-contracts.read_corporation_contracts.v1')
        const character_name: string = character.characterName.toLowerCase().replace(" ", "_")
        let body = `<h1>Welcome, ${character_name}!</h1>`

        const response = await getCorpContracts(this.esi['request'], token, CHARACTERS_BY_ID[character.characterId].corperation_id);

        // const response = await this.esi.request<CorpContacts[]>(
        //     `/corporations/${CHARACTERS_BY_ID[character.characterId].corperation_id}/contracts/`,
        //     null,
        //     null,
        //     { token }
        // );

        const contracts: CorpContracts[] = await response.json()
        body += `<p>Contacts:</p><ul>`
        for (const contract of contracts) {
            if (contract.assignee_id != CHARACTERS_BY_ID[character.characterId].corperation_id) continue;
            if (contract.status != IStatus.in_progress && contract.status != IStatus.outstanding) continue;
            body += `<li>title:${contract.title},type:${contract.type},price:${contract.price},issuer:${contract.issuer_id}</li>`
        }
        body += '</ul>'
        ctx.body = body
    }
}