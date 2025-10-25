import config from '@/config/config';
import winston from 'winston';
const { colorize, combine, timestamp, printf, errors } = winston.format;

const logger = winston.createLogger({
    level: config.logLevel,
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        errors({ stack: true }),
        printf((info) => {
            const { timestamp, level, message, ...meta } = info;

            // Base log message
            let log = `[${timestamp}] ${level.padEnd(15)}: ${message}`;

            // Add metadata if present
            const metaKeys = Object.keys(meta).filter(key =>
                !['timestamp', 'level', 'message', 'splat', Symbol.for('level')].includes(key)
            );

            if (metaKeys.length > 0) {
                const metaObj: Record<string, any> = {};
                metaKeys.forEach(key => {
                    metaObj[key] = meta[key];
                });
                log += `\n${JSON.stringify(metaObj, null, 2)}`;
            }

            return log;
        })
    ),
    transports: [new winston.transports.Console()],
});

export default logger;
