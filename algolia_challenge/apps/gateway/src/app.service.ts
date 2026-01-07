// apps/gateway/src/app.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AppService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AppService.name);
  }

  async callAuthService(pattern: any, data: any) {
    const sanitizedData = { ...data };
    if (sanitizedData.password) sanitizedData.password = '***';
    
    this.logger.debug({ pattern, data: sanitizedData }, 'Calling auth service');

    try {
      const startTime = Date.now();
      const result = await firstValueFrom(
        this.authService.send(pattern, data).pipe(timeout(5000)),
      );
      const duration = Date.now() - startTime;

      this.logger.info({ pattern, duration, success: result?.success }, 'Auth service responded');
      return result;
    } catch (error) {
      this.logger.error({ pattern, error: error.message }, 'Auth service failed');
      throw new Error('Auth service unavailable');
    }
  }
}