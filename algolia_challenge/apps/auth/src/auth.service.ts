// apps/auth/src/auth.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import { User, UserDocument } from 'common/database/user.schema';
import { PasswordUtils } from 'core/utils/password.utils.ts/password.utils';
import { LoginDto } from 'common/dto/login.user.dto';
import { RegisterDto } from 'common/dto/register.user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) 
    private userModel: Model<UserDocument>,
    private passwordUtils: PasswordUtils,
    private jwtService: JwtService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async getUsers() {
    this.logger.debug('Fetching all users from database');
    
    const users = await this.userModel.find().select('-password').exec();
    
    this.logger.info(
      { userCount: users.length },
      'Users retrieved from database'
    );
    
    return users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async login(userCredentials: LoginDto) {
    this.logger.debug(
      { email: userCredentials.email },
      'Attempting to find user in database'
    );
    
    const user = await this.userModel.findOne({ email: userCredentials.email }).exec();
    
    if (!user) {
      this.logger.warn(
        { email: userCredentials.email },
        'User not found in database'
      );
      
      return { 
        success: false, 
        message: 'Invalid credentials' 
      };
    }

    this.logger.debug(
      { email: userCredentials.email, userId: user._id.toString() },
      'User found, validating password'
    );

    const isPasswordValid = await this.passwordUtils.compare(
      userCredentials.password, 
      user.password
    );

    if (!isPasswordValid) {
      this.logger.warn(
        { email: userCredentials.email, userId: user._id.toString() },
        'Invalid password provided'
      );
      
      return { 
        success: false, 
        message: 'Invalid credentials' 
      };
    }

    this.logger.debug(
      { email: userCredentials.email, userId: user._id.toString() },
      'Password validated, generating JWT token'
    );

    const payload = { 
      sub: user._id.toString(),
      email: user.email,
      name: user.name 
    };
    
    const token = await this.jwtService.signAsync(payload);
    
    this.logger.info(
      { email: userCredentials.email, userId: user._id.toString() },
      'JWT token generated successfully'
    );

    return {
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    };
  }

  async registerUser(userData: RegisterDto) {
    this.logger.debug(
      { email: userData.email },
      'Checking if user already exists'
    );
  
    const existingUser = await this.userModel.findOne({ email: userData.email }).exec();
    
    if (existingUser) {
      this.logger.warn(
        { email: userData.email },
        'User with this email already exists'
      );
      
      return { 
        success: false, 
        message: 'User with this email already exists' 
      };
    }
    
    this.logger.debug(
      { email: userData.email },
      'Hashing user password'
    );
    
    const hashedPassword = await this.passwordUtils.hash(userData.password);
    userData.password = hashedPassword;
  
    this.logger.debug(
      { email: userData.email },
      'Creating new user in database'
    );
    
    const newUser = new this.userModel(userData);
    const savedUser = await newUser.save();
  
    this.logger.info(
      { email: userData.email, userId: savedUser._id.toString() },
      'User created successfully in database'
    );
  
    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: savedUser._id.toString(),
        name: savedUser.name,
        email: savedUser.email,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
      },
    };
  }
}