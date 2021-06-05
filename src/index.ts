
// import ESI from 'eve-esi-client';
// import MemoryProvider from 'eve-esi-client/dist/providers/memory.js';
// import Koa from 'koa';
// import Router from 'koa-router';
import { client_id, secret } from "./secret.js";

import SingleSignOn from 'eve-sso'
import Koa from 'koa'
import Router from 'koa-router'


const PORT = 8002;
// Get the client ID and secret from the Eve developers section

// The callback URI as defined in the application in the developers section
const CALLBACK_URI = 'https://www.garbagecollectorb.com/callback'

const sso = new SingleSignOn(client_id, secret, CALLBACK_URI, {
  endpoint: 'https://login.eveonline.com', // optional, defaults to this
  userAgent: 'my-user-agent' // optional
})

const app = new Koa()
const router = new Router()

// Show a login redirect link
router.get('/login', async ctx => {
  // The first argument is a required state, which you can verify in the callback
  // The second argument is an optional space-delimited string or string array of scopes to request
  ctx.body = `<a href="${sso.getRedirectUrl('my-state')}">Login to Eve Online</a>`
})

// Handle the SSO callback (this route is the CALLBACK_URI above)
router.get('/callback', async ctx => {
  // Get the one-time access code
  const code: string = ctx.query.code.toString()
  // NOTE: usually you'd want to validate the state (ctx.query.state) as well

  // Swap the one-time code for an access token
  const info = await sso.getAccessToken(code)

  // Usually you'd want to store the access token
  // as well as the refresh token
  console.log('info', info)
  
  // Do whatever, for example, redirect to user page
  ctx.body = 'You are now authenticated!'
})



// const provider = new MemoryProvider();
// const esi = new ESI({
//     provider,
//     clientId: client_id,
//     secretKey: secret,
//     callbackUri: 'https://www.garbagecollectorb.com/callback'
// });

// const app = new Koa();
// const router = new Router();

// router.get('/login', async ctx => {
//     const redirectUrl = esi.getRedirectUrl('some-state', 'esi-skills.read_skills.v1');

//     ctx.body = `<a href="${redirectUrl}">Log in using Eve Online</a>`;
// })


// router.get('/callback', async ctx => {
//     const code: string = ctx.query.code.toString();
//     const { character } = await esi.register(code);

//     ctx.res.statusCode = 302;
//     ctx.res.setHeader('Location', `/welcome/${character.characterId}`);
// })

app.use(router.middleware());
app.listen(PORT, function () {
    console.log(`Server listening on port ${PORT}`);
});