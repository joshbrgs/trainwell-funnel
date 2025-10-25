import logger from '@/lib/logger';
import morgan from 'morgan';

export const loggerMiddleware = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    {
        stream: {
            write: (message: string) => {
                // Parse the morgan output
                const parts = message.trim().split(' ');
                const method = parts[0] || 'UNKNOWN';
                const url = parts[1] || 'UNKNOWN';
                const status = parseInt(parts[2] || '0');
                const responseTime = parts[parts.length - 2] || '0';

                logger.http('HTTP Request', {
                    method,
                    url,
                    status,
                    responseTime: `${responseTime}ms`,
                });
            },
        },
    }
);