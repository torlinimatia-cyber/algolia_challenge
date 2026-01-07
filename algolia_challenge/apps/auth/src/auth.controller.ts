import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PinoLogger } from 'nestjs-pino';
import { AuthService } from './auth.service';
import { ResponseMessages } from 'common/constants/response.messages';
import { RegisterDto } from 'common/dto/register.user.dto'; 
import { LoginDto } from 'common/dto/login.user.dto'; 

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthController.name);
  }
  
  @MessagePattern({ cmd: 'auth_get_users' })
  async getUsers(@Payload() data: any) {
    const correlationId = data?.correlationId;
    
    this.logger.info(
      { correlationId, command: 'auth_get_users' },
      'Fetching all users'
    );

    try {
      const users = await this.authService.getUsers();
      
      this.logger.info(
        { correlationId, userCount: users.length },
        'Users fetched successfully'
      );

      return users;
    } catch (error) {
      this.logger.error(
        { correlationId, error: error.message },
        'Failed to fetch users'
      );
      throw error;
    }
  }

  @MessagePattern({ cmd: 'auth_register' })
async register(@Payload() userData: RegisterDto) {
  const correlationId = userData['correlationId'];
  
  this.logger.info(
    { correlationId, email: userData.email, command: 'auth_register' },
    'User registration request'
  );

  try {
    const result = await this.authService.registerUser(userData);
    
    this.logger.info(
      { correlationId, userId: result.user?.id, email: userData.email },
      'User registered successfully'
    );

    return {
      success: true,
      message: ResponseMessages.AUTH.USER_CREATED,
      user: result.user,
    };
  } catch (error) {
    this.logger.error(
      { correlationId, email: userData.email, error: error.message },
      'Registration failed'
    );

    return {
      success: false,
      message: error.message || ResponseMessages.AUTH.USER_ALREADY_EXISTS,
    };
  }
}

  @MessagePattern({ cmd: 'auth_login' })
  async login(@Payload() userCredentials: LoginDto) {
    const correlationId = userCredentials['correlationId'];
    
    this.logger.info(
      { correlationId, email: userCredentials.email, command: 'auth_login' },
      'User login request'
    );

    try {
      const result = await this.authService.login(userCredentials);
      
      this.logger.info(
        { correlationId, userId: result.user?.id, email: userCredentials.email },
        'User logged in successfully'
      );

      return result;
    } catch (error) {
      this.logger.warn(
        { correlationId, email: userCredentials.email, error: error.message },
        'Login failed'
      );

      return {
        success: false,
        message: error.message || ResponseMessages.AUTH.INVALID_CREDENTIALS,
      };
    }
  }
}