//import * as fs from 'fs';
import * as Koa from 'koa';
import * as KoaPinoLogger from 'koa-pino-logger';
import * as KoaRouter from 'koa-router';
import * as KoaStatic from 'koa-static';
import * as KoaViews from 'koa-views';
import * as os from 'os';
import * as path from 'path';
import * as Pino from 'pino';
import * as reportRoutes from './repos';

//import * as Yaml from 'js-yaml';

const app = new Koa();

const logger = Pino();

app.use(KoaPinoLogger({ logger: logger }));

/*
app.use(async(ctx, next) => {
    const start = process.hrtime();

    await next();

    const duration = process.hrtime(start);

    console.log(`${ctx.req.url}: ${duration[0] * 1000 + duration[1] / 1e6} ns`);
});
*/
app.use(async(ctx, next) => {
    try {
        await next();
        const status = ctx.status || 404;
        if (status === 404) {
            ctx.status = 404;
            await ctx.render('404.hbs', { title: '404', h1: '404 - Page not found', url: ctx.req.url });
        }
    } catch (err) {
        ctx.status = 500;
        await ctx.render('500.hbs', { title: 'Server Error', message: err.message });
    }
    console.log("err done");
});

app.use(KoaStatic("static"));

app.use(KoaViews(path.join(__dirname, '..', 'views'), {
    map: { hbs: 'handlebars' },
    options: {
        helpers: {

        },
        partials: {
            above: path.join(__dirname, '..', 'partials', 'above'),
            below: path.join(__dirname, '..', 'partials', 'below')
        }
    }
}));


//const yamlData = Yaml.safeLoad(fs.readFileSync(path.join(__dirname, "..", "data", "repos.yaml"), 'utf8'));

app.use(reportRoutes.router.routes());

const rootRouter = new KoaRouter();

rootRouter.get('/', async (ctx) => {
    await ctx.render('index.hbs', { h1: 'Git Logo Search', title: 'Search' });
});

rootRouter.get('/index.html', async (ctx) => {
    await ctx.redirect('/');
});

rootRouter.get('/about.html', async (ctx) => {
    await ctx.render('about.hbs', { title: 'About' });
});

rootRouter.get( '/status.json', async (ctx: Koa.Context) => {

    const retVal: {[key: string]: any} = {};

    retVal["success"] = true;
    retVal["message"] = "OK";
    retVal["timestamp"] = new Date().toISOString();
    retVal["lastmod"] = process.env.LASTMOD || null;
    retVal["commit"] = process.env.COMMIT || null;
    retVal["__dirname"] = __dirname;
    retVal["__filename"] = __filename;
    retVal["os.hostname"] = os.hostname();
    retVal["os.type"] = os.type();
    retVal["os.platform"] = os.platform();
    retVal["os.arch"] = os.arch();
    retVal["os.release"] = os.release();
    retVal["os.uptime"] = os.uptime();
    retVal["os.loadavg"] = os.loadavg();
    retVal["os.totalmem"] = os.totalmem();
    retVal["os.freemem"] = os.freemem();
    retVal["os.cpus.length"] = os.cpus().length;
    // too much junk: retVal["os.networkInterfaces"] = os.networkInterfaces();

    retVal["process.arch"] = process.arch;
    retVal["process.cwd"] = process.cwd();
    retVal["process.execPath"] = process.execPath;
    retVal["process.memoryUsage"] = process.memoryUsage();
    retVal["process.platform"] = process.platform;
    retVal["process.release"] = process.release;
    retVal["process.title"] = process.title;
    retVal["process.uptime"] = process.uptime();
    retVal["process.version"] = process.version;
    retVal["process.versions"] = process.versions;

    sendJSON(ctx, retVal);
});

function sendJSON(ctx: Koa.Context, data: object) {

    const callback = ctx.request.query['callback'];
    if (callback && callback.match(/^[$A-Za-z_][0-9A-Za-z_$]*$/) != null) {
        ctx.body = callback + '(' + JSON.stringify(data) + ');';
    } else {
        ctx.body = JSON.stringify(data);
    }
}

app.use(rootRouter.routes());

const port = parseInt(process.env.PORT || '4000');

app.listen(port);

logger.info({ port: port }, 'server running');