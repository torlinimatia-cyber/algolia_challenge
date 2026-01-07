import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AuthModule } from './auth.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const port = parseInt(process.env.PORT || '3001');
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: port,
      },
      bufferLogs: true,
    },
  );
  
  // Use Pino logger
  app.useLogger(app.get(Logger));
  
  await app.listen();
  
  const logger = app.get(Logger);
  logger.log(`Auth Service microservice is listening on port ${port}`);
}
bootstrap();