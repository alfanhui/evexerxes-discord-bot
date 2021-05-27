const SingleSignOn = require('eve-sso').default;
const Koa = require('koa');
const Router = require('koa-router');

const PORT = 8002;
// Get the client ID and secret from the Eve developers section
const CLIENT_ID = require('./secret.js').client_id;
const SECRET = require('./secret.js').secret;
// The callback URI as defined in the application in the developers section
const CALLBACK_URI = `https://www.garbagecollectorb.com/callback`

const sso = new SingleSignOn(CLIENT_ID, SECRET, CALLBACK_URI, {
    endpoint: 'https://login.eveonline.com', // optional, defaults to this
    userAgent: 'my-user-agent' // optional
})

const app = new Koa();
const router = new Router();

// Show a login redirect link
router.get('/login', async = (ctx) => {
    console.log("login hit")
        // The first argument is a required state, which you can verify in the callback
        // The second argument is an optional space-delimited string or string array of scopes to request
    ctx.body = `<a href=${sso.getRedirectUrl('my-state')}>Login to Eve Online</a>`
})

// Handle the SSO callback (this route is the CALLBACK_URI above)
router.get('/callback', async = (ctx) => {
    console.log("callback hit")
        // Get the one-time access code
    var code = ctx.query.code
        // NOTE: usually you'd want to validate the state (ctx.query.state) as well

    // Swap the one-time code for an access token
    var info = sso.getAccessToken(code); //await

    // Usually you'd want to store the access token
    // as well as the refresh token
    info.then((response) => {
        console.log('info', response)
            // Do whatever, for example, redirect to user page
        ctx.body = 'You are now authenticated!'
    }).catch((reason) => {
        console.error(reason)
    })
})

app.use(router.middleware())
app.listen(PORT, function() {
    console.log(`Server listening on port ${PORT}`)
})
