import { Scheduler } from './scheduler';
import Koa from 'koa';
import { Routes } from './routes.js';

const PORT = 8002;
const routes = new Routes();
const app = new Koa();
const scheduler = new Scheduler();
app.use(routes.getRouter().middleware());
app.listen(PORT, function () {
    console.log(`Server listening on port ${PORT}`);
});