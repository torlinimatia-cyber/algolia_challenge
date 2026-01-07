import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import {
  minutes,
  seconds,
  ThrottlerGuard,
  ThrottlerModule,
} from "@nestjs/throttler";

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { jwtConstants } from 'common/constants/jwt.constants';
import { AuthGuard } from 'common/guards/auth.guard';

import { MiddlewareConsumer } from '@nestjs/common';
import { NestModule } from '@nestjs/common';

import { CorrelationIdMiddleware } from 'core/logger/correlation.middleware';
import { LoggerModule } from 'nestjs-pino';
import { loggerConfig } from 'config/logger.config';


@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig('GATEWAY')),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3001 },
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule,
          ThrottlerModule.forRoot({
            throttlers: [
              {
                name: "first",
                ttl: 1000,
                limit: 1,
                blockDuration: 1000,
              },
              {
                name: "second",
                ttl: seconds(10),
                limit: 5,
                blockDuration: seconds(5),
              },
              {
                name: "third",
                ttl: minutes(1), 
                limit: 25,
              },
            ],
            errorMessage: "too many requests!",
          })
        ],
        useFactory: (configService: ConfigService) => {
          const host = configService.get<string>('AUTH_HOST', 'localhost');
          const port = configService.get<number>('AUTH_PORT', 3001);
          
          console.log(`Connecting to Auth Service at ${host}:${port}`);
          
          return {
            transport: Transport.TCP,
            options: {
              host: host,
              port: port,
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
    CacheModule.register({
      ttl: 5000,
      max: 100,
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}