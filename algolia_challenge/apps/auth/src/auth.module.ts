import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from 'nestjs-pino';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from 'common/database/user.schema';
import { PasswordUtils } from 'core/utils/password.utils.ts/password.utils';
import { jwtConstants } from 'common/constants/jwt.constants';
import { loggerConfig } from 'config/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot(loggerConfig('AUTH')),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('MONGO_HOST', 'localhost');
        const port = configService.get<string>('MONGO_PORT', '27017');
        const username = configService.get<string>('MONGO_USERNAME', 'admin');
        const password = configService.get<string>('MONGO_PASSWORD', 'admin123');
        const database = configService.get<string>('MONGO_DATABASE', 'auth_db');
        
        const uri = `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
        
        console.log('MongoDB Connection Details:', { host, port, username, database });
        console.log('MongoDB URI:', uri.replace(password, '***'));
        
        return { uri };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordUtils],
})
export class AuthModule {}