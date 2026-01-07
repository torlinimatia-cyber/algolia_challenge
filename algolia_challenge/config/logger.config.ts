// src/common/logger.config.ts
import { Params } from 'nestjs-pino';

export const loggerConfig = (serviceName: string): Params => ({
  pinoHttp: {
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        singleLine: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
    customProps: (req) => ({
      correlationId: req['correlationId'],
    }),
    base: {
      service: serviceName,
    },
  },
});