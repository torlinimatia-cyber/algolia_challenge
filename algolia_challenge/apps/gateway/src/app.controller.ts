import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  HttpException, 
  HttpStatus,
  HttpCode, 
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody 
} from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { PinoLogger } from 'nestjs-pino';
import type { Request } from 'express';

import { AppService } from './app.service';
import { RegisterDto } from 'common/dto/register.user.dto';
import { LoginDto } from 'common/dto/login.user.dto';
import { RegisterRto } from 'common/rto/register.user.rto';
import { Public } from 'common/decorators/public.decorator';
import { LoginUserRto } from 'common/rto/login.user.rto';
import { ResponseMessages, ResponseErrors } from 'common/constants/response.messages';
import { UserRto } from 'common/rto/user.rto'; 

@ApiTags('Authentication')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AppController.name);
  }

  // ##########################################
  // ######         AUTH/USERS           ######
  // ##########################################

  @ApiOperation({ 
    summary: 'Get all users',
    description: 'Retrieve a list of all registered users',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: ResponseMessages.AUTH.USERS_RETRIEVED,
    type: [UserRto],
  })
  @ApiResponse({ 
    status: HttpStatus.SERVICE_UNAVAILABLE, 
    description: ResponseMessages.AUTH.SERVICE_UNAVAILABLE,
    schema: {
      example: {
        message: ResponseMessages.AUTH.SERVICE_UNAVAILABLE,
        error: ResponseErrors.SERVICE_UNAVAILABLE,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      },
    },
  })
  @CacheTTL(5000)
  @UseInterceptors(CacheInterceptor)
  @Throttle({
    default: {
      limit: 1,
      ttl: 1000,
    },
  })
  @Get('auth/users')
  async getAllUsers(@Req() req: Request): Promise<UserRto[]> {
    const correlationId = req['correlationId'];
    
    this.logger.info(
      { correlationId, endpoint: 'GET /auth/users' },
      'Fetching all users'
    );

    try {
      this.logger.debug(
        { correlationId },
        'Calling auth service for users list'
      );

      const result = await this.appService.callAuthService(
        { cmd: 'auth_get_users' },
        { correlationId },
      );

      this.logger.info(
        { correlationId, userCount: result.length },
        'Users retrieved successfully'
      );

      return result;
    } catch (error) {
      this.logger.error(
        { correlationId, error: error.message },
        'Failed to fetch users - auth service unavailable'
      );

      throw new HttpException(
        ResponseMessages.AUTH.SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // ##########################################
  // ######         AUTH/REGISTER        ######
  // ##########################################

  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Create a new user account with name, email, and password',
  })
  @ApiBody({ 
    type: RegisterDto,
    description: 'User registration data',
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: ResponseMessages.AUTH.USER_REGISTERED,
    type: RegisterRto,
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Bad request - validation failed or user already exists',
    schema: {
      example: {
        message: ResponseMessages.AUTH.USER_ALREADY_EXISTS,
        error: ResponseErrors.BAD_REQUEST,
        statusCode: HttpStatus.BAD_REQUEST,
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.SERVICE_UNAVAILABLE, 
    description: ResponseMessages.AUTH.SERVICE_UNAVAILABLE,
    schema: {
      example: {
        message: ResponseMessages.AUTH.SERVICE_UNAVAILABLE,
        error: ResponseErrors.SERVICE_UNAVAILABLE,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      },
    },
  })
  @Public()
  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  @SkipThrottle()
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
  ): Promise<RegisterRto> {
    const correlationId = req['correlationId'];
    
    this.logger.info(
      { correlationId, email: registerDto.email, endpoint: 'POST /auth/register' },
      'User registration attempt'
    );

    try {
      this.logger.debug(
        { correlationId, email: registerDto.email },
        'Calling auth service for registration'
      );

      const result = await this.appService.callAuthService(
        { cmd: 'auth_register' },
        { ...registerDto, correlationId },
      );
      
      if (!result.success) {
        this.logger.warn(
          { correlationId, email: registerDto.email, reason: result.message },
          'Registration failed'
        );

        throw new HttpException(
          result.message || ResponseMessages.AUTH.REGISTRATION_FAILED,
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.info(
        { correlationId, userId: result.user?.id, email: registerDto.email },
        'User registered successfully'
      );
      
      return {
        success: result.success,
        message: result.message,
        user: result.user,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        { correlationId, email: registerDto.email, error: error.message },
        'Registration failed - auth service unavailable'
      );
      
      throw new HttpException(
        ResponseMessages.AUTH.SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // ##########################################
  // ######         AUTH/LOGIN           ######
  // ##########################################

  @Public()
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Login',
    description: 'Authenticate user with email and password',
  })
  @ApiBody({ 
    type: LoginDto,
    description: 'User login credentials',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: ResponseMessages.AUTH.LOGIN_SUCCESSFUL,
    type: LoginUserRto,  
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: ResponseMessages.AUTH.INVALID_CREDENTIALS,
    schema: {
      example: {
        message: ResponseMessages.AUTH.INVALID_CREDENTIALS,
        error: ResponseErrors.UNAUTHORIZED,
        statusCode: HttpStatus.UNAUTHORIZED,
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.SERVICE_UNAVAILABLE, 
    description: ResponseMessages.AUTH.SERVICE_UNAVAILABLE,
    schema: {
      example: {
        message: ResponseMessages.AUTH.SERVICE_UNAVAILABLE,
        error: ResponseErrors.SERVICE_UNAVAILABLE,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ) {
    const correlationId = req['correlationId'];
    
    this.logger.info(
      { correlationId, email: loginDto.email, endpoint: 'POST /auth/login' },
      'User login attempt'
    );

    try {
      this.logger.debug(
        { correlationId, email: loginDto.email },
        'Calling auth service for authentication'
      );

      const result = await this.appService.callAuthService(
        { cmd: 'auth_login' },
        { ...loginDto, correlationId },
      );
      
      if (!result.success) {
        this.logger.warn(
          { correlationId, email: loginDto.email, reason: result.message },
          'Login failed - invalid credentials'
        );

        throw new HttpException(
          result.message || ResponseMessages.AUTH.LOGIN_FAILED,
          HttpStatus.UNAUTHORIZED,
        );
      }

      this.logger.info(
        { correlationId, userId: result.user?.id, email: loginDto.email},
        'User logged in successfully'
      );

      return result;

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        { correlationId, email: loginDto.email, error: error.message },
        'Login failed - auth service unavailable'
      );
      
      throw new HttpException(
        ResponseMessages.AUTH.SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}