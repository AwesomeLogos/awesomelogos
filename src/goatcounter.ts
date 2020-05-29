import axios from 'axios';
import Koa from 'koa';

import { config } from './config';
import { getCurrentIP } from './util';
import { logger } from './logger';


const client = axios.create({
    timeout: 2500,
});

async function middleware(ctx: Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext>, next: Koa.Next) {
    if (!config.get('goatCounterHost')) {
        return;
    }
    try {
        await next();
        client.get(`https://${config.get('goatCounterHost')}/count`, {
                params: {
                p: ctx.path,
                r: ctx.headers['referrer'] || ctx.headers['referer'],
                q: ctx.querystring,
            },
            timeout: 2500,
            headers: {
                'user-agent': ctx.headers['user-agent'] || 'Mozilla/5.0 NoUserAgent/1.0',
                'X-Forwarded-For': getCurrentIP(ctx)
            },
            validateStatus: function (status) {
                return true;
            }
        })
        .then((response) => { logger.trace({ params: response.config.params, headers: response.headers, url: ctx.request.originalUrl, statusCode: response.status, statusText: response.statusText, responseData: response.data }, "GoatCounter hit logged"); })
        .catch((err) => { logger.error({ err }, "GoatCounter post error"); })
        ;
    } catch (err) {
        logger.error( { err }, "GoatCounter middleware error");
    }
}

export {
    middleware
}

