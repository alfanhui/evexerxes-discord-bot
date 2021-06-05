
import ESI from 'eve-esi-client';
import MemoryProvider from 'eve-esi-client/dist/providers/memory.js';
import Koa from 'koa';
import Router from 'koa-router';
import { CLIENT_ID, SECRET } from "./secret.js";


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

const AUTHORISED = ["esi-skills.read_skills.v1"];

router.get('/login', async ctx => {
    const redirectUrl = esi.getRedirectUrl('some-state', AUTHORISED);

    ctx.body = `<a href="${redirectUrl}">Log in using Eve Online</a>`;
})

router.get('/callback', async ctx => {
    const code: string = ctx.query.code.toString();
    const { character } = await esi.register(code);

    ctx.res.statusCode = 302;
    ctx.res.setHeader('Location', `/welcome/${character.characterId}`);
})

app.use(router.middleware());
app.listen(PORT, function () {
    console.log(`Server listening on port ${PORT}`);
});