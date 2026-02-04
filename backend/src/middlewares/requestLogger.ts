import morgan from 'morgan';
import { env } from '../config/env.js';

// Custom token for response time
morgan.token('response-time-ms', (_req, res) => {
    const responseTime = res.getHeader('X-Response-Time');
    return responseTime ? `${responseTime}ms` : '-';
});

// Development format - colorful and detailed
const devFormat = ':method :url :status :response-time ms - :res[content-length]';

// Production format - JSON-like for log aggregation
const prodFormat = JSON.stringify({
    method: ':method',
    url: ':url',
    status: ':status',
    responseTime: ':response-time',
    contentLength: ':res[content-length]',
    userAgent: ':user-agent',
    ip: ':remote-addr',
});

export const requestLogger = morgan(
    env.NODE_ENV === 'production' ? prodFormat : devFormat,
    {
        skip: (req) => {
            // Skip health check endpoints in production
            if (env.NODE_ENV === 'production' && req.url === '/health') {
                return true;
            }
            return false;
        },
    }
);
