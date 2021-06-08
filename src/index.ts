
import ESI from 'eve-esi-client';
import MemoryProvider from 'eve-esi-client/dist/providers/memory.js';
import Koa from 'koa';
import Router from 'koa-router';
import { CLIENT_ID, SECRET } from "./secret.js";
import { AUTHORISATIONS } from "./data/authorisations.js";
import { getCorpContacts } from "./endpoints.js";
import { corperations } from "./data/corperations";


const PORT = 8002;
const CALLBACK_URI = 'https://www.garbagecollectorb.com/callback'
const provider = new MemoryProvider();
const esi = new ESI({
    provider,
    clientId: CLIENT_ID,
    secretKey: SECRET,
    callbackUri: CALLBACK_URI
});

const app = new Koa();
const router = new Router();

router.get('/login', async ctx => {
    const redirectUrl = esi.getRedirectUrl('some-state', AUTHORISATIONS[98662212]);

    ctx.body = `<a href="${redirectUrl}">Log in using Eve Online</a>`;
})

router.get('/callback', async ctx => {
    const code: string = ctx.query.code.toString();
    const { character } = await esi.register(code);

    ctx.res.statusCode = 302;
    ctx.res.setHeader('Location', `/welcome/${character.characterId}`);
})

router.get('/welcome/:characterId', async ctx => {
    const characterId = Number(ctx.params.characterId)
    const character = await provider.getCharacter(characterId)
    const token = await provider.getToken(characterId, 'esi-contracts.read_corporation_contracts.v1')

    let body = `<h1>Welcome, ${character.characterName}!</h1>`

    const response = await getCorpContacts(
        esi.request,
        token,
        corperations['pixel knights']
    )

    const contracts = await response.json()

    body += `<p>Contact: ${contracts.contract_id} has been assigned to ${contracts.for_corporation}.</p><ul>`

    for (const skill of skills.skills) {
        body += `<li>${skill.skill_id}: ${skill.active_skill_level}</li>`
    }

    body += '</ul>'

    ctx.body = body
})

app.use(router.middleware());
app.listen(PORT, function () {
    console.log(`Server listening on port ${PORT}`);
});