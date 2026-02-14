import winston from 'winston';
import { env } from '../config/env.js';

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const level = () => {
    const isDevelopment = env.NODE_ENV === 'development';
    return isDevelopment ? 'debug' : 'warn';
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

const transports = [
    new winston.transports.Console({
        format: env.NODE_ENV === 'production'
            ? winston.format.json() // JSON format for production (better for tools like Datadog/ELK)
            : format, // Pretty print for development
    }),
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.json(),
    }),
    new winston.transports.File({
        filename: 'logs/all.log',
        format: winston.format.json(),
    }),
];

export const Logger = winston.createLogger({
    level: level(),
    levels,
    transports,
});
