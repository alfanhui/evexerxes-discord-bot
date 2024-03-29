import Koa from 'koa';
import { Routes } from './src/routes';
import MongoProvider from 'eve-esi-client-mongo-provider';
import ESI from 'eve-esi-client';
import { DiscordNotifier } from './src/notifier/discordNotifier';
import { Cron } from './src/scheduler/cron';
require('dotenv').config()

const PORT = process.env.PORT;
const user = process.env?.MONGODB_USER;
const pass = process.env?.MONGODB_PASSWORD;
const provider = new MongoProvider(process.env.MONGODB_URL, {
    connectionOptions: {
        dbName: 'esi',
        user,
        pass,
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
});
const esi = new ESI({
    provider: provider,
    clientId: process.env.EVE_CLIENT_ID,
    secretKey: process.env.EVE_SECRET,
    callbackUri: process.env.CALLBACK_URI
});
const discordNotifer = new DiscordNotifier(provider);
const routes = new Routes(provider, esi, discordNotifer);
const app = new Koa();
var bodyParser = require('koa-body');
//Set up body parsing middleware
app.use(bodyParser({
    multipart: true,
    urlencoded: true
}));
app.use(routes.getRouter().middleware());
app.listen(PORT, function () {
    console.log(`Server listening on port ${PORT}`);
});

//Start scheduler
const cron = new Cron(provider, esi, discordNotifer);
