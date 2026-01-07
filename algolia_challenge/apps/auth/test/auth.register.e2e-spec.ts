import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { AuthService } from './auth.service';
import { User, UserDocument } from '../../../common/database/user.schema';
import { PasswordUtils } from '../../../core/utils/password.utils.ts/password.utils';
import { RegisterDto } from 'common/dto/register.user.dto';

describe('AuthService - registerUser', () => {
  let authService: AuthService;
  let userModel: Model<UserDocument>;
  let passwordUtils: PasswordUtils;
  let jwtService: JwtService;

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockSavedUser = {
    _id: {
      toString: () => mockUserId,
    },
    email: 'newuser@example.com',
    password: 'hashedPassword123',
    name: 'New User',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    save: jest.fn(),
  };

  const mockUserModel = {
    findOne: jest.fn().mockReturnValue({
      exec: jest.fn(),
    }),
    prototype: {
      save: jest.fn(),
    },
  } as any;

  const mockPasswordUtils = {
    compare: jest.fn(),
    hash: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    // Reset the mock constructor
    mockUserModel.mockClear = jest.fn();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: PasswordUtils,
          useValue: mockPasswordUtils,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
    passwordUtils = module.get<PasswordUtils>(PasswordUtils);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should be defined', () => {
      expect(authService.registerUser).toBeDefined();
    });

    it('should successfully register a new user with valid data', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const hashedPassword = 'hashedPassword123';

      mockUserModel.findOne().exec.mockResolvedValue(null);
      mockPasswordUtils.hash.mockResolvedValue(hashedPassword);
      
      // Mock the constructor and save method
      const saveMock = jest.fn().mockResolvedValue(mockSavedUser);
      mockUserModel.mockImplementation(() => ({
        save: saveMock,
      }));

      const result = await authService.registerUser(registerDto);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBe('User registered successfully');
      expect(result.user).toEqual({
        id: mockUserId,
        name: mockSavedUser.name,
        email: mockSavedUser.email,
        createdAt: mockSavedUser.createdAt,
        updatedAt: mockSavedUser.updatedAt,
      });
    });

    it('should check if user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      mockUserModel.findOne().exec.mockResolvedValue(null);
      mockPasswordUtils.hash.mockResolvedValue('hashedPassword');

      await authService.registerUser(registerDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: registerDto.email,
      });
      expect(mockUserModel.findOne().exec).toHaveBeenCalled();
    });

    it('should return error when email already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Duplicate User',
      };

      const existingUser = {
        _id: 'existingId',
        email: 'existing@example.com',
        name: 'Existing User',
      };

      mockUserModel.findOne().exec.mockResolvedValue(existingUser);

      const result = await authService.registerUser(registerDto);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.message).toBe('User with this email already exists');
      expect(result.user).toBeUndefined();
      expect(mockPasswordUtils.hash).not.toHaveBeenCalled();
    });

    it('should hash password before saving', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'plainPassword123',
        name: 'New User',
      };

      const hashedPassword = 'hashedPassword123';

      mockUserModel.findOne().exec.mockResolvedValue(null);
      mockPasswordUtils.hash.mockResolvedValue(hashedPassword);

      const saveMock = jest.fn().mockResolvedValue(mockSavedUser);
      mockUserModel.mockImplementation(() => ({
        save: saveMock,
      }));

      await authService.registerUser(registerDto);

      expect(mockPasswordUtils.hash).toHaveBeenCalledWith(registerDto.password);
      expect(mockPasswordUtils.hash).toHaveBeenCalledTimes(1);
    });

    it('should not expose password in response', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      mockUserModel.findOne().exec.mockResolvedValue(null);
      mockPasswordUtils.hash.mockResolvedValue('hashedPassword');

      const saveMock = jest.fn().mockResolvedValue(mockSavedUser);
      mockUserModel.mockImplementation(() => ({
        save: saveMock,
      }));

      const result = await authService.registerUser(registerDto);

      expect(result.user).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('password');
      const resultString = JSON.stringify(result);
      expect(resultString).not.toContain('password123');
      expect(resultString).not.toContain('hashedPassword');
    });

    it('should save user with hashed password', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'plainPassword',
        name: 'New User',
      };

      const hashedPassword = 'hashed_plainPassword';

      mockUserModel.findOne().exec.mockResolvedValue(null);
      mockPasswordUtils.hash.mockResolvedValue(hashedPassword);

      const saveMock = jest.fn().mockResolvedValue(mockSavedUser);
      let capturedUserData: any;
      
      mockUserModel.mockImplementation((data) => {
        capturedUserData = data;
        return {
          save: saveMock,
        };
      });

      await authService.registerUser(registerDto);

      expect(capturedUserData.password).toBe(hashedPassword);
      expect(capturedUserData.password).not.toBe(registerDto.password);
    });

    it('should include createdAt and updatedAt in response', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      mockUserModel.findOne().exec.mockResolvedValue(null);
      mockPasswordUtils.hash.mockResolvedValue('hashedPassword');

      const saveMock = jest.fn().mockResolvedValue(mockSavedUser);
      mockUserModel.mockImplementation(() => ({
        save: saveMock,
      }));

      const result = await authService.registerUser(registerDto);

      expect(result.user.createdAt).toBeDefined();
      expect(result.user.updatedAt).toBeDefined();
      expect(result.user.createdAt).toEqual(mockSavedUser.createdAt);
      expect(result.user.updatedAt).toEqual(mockSavedUser.updatedAt);
    });

    it('should convert MongoDB ObjectId to string', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      mockUserModel.findOne().exec.mockResolvedValue(null);
      mockPasswordUtils.hash.mockResolvedValue('hashedPassword');

      const saveMock = jest.fn().mockResolvedValue(mockSavedUser);
      mockUserModel.mockImplementation(() => ({
        save: saveMock,
      }));

      const result = await authService.registerUser(registerDto);

      expect(typeof result.user.id).toBe('string');
      expect(result.user.id).toBe(mockUserId);
    });

    it('should handle database errors during user check', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      mockUserModel.findOne().exec.mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(authService.registerUser(registerDto)).rejects.toThrow(
        'Database connection error',
      );
    });

    it('should handle password hashing errors', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      mockUserModel.findOne().exec.mockResolvedValue(null);
      mockPasswordUtils.hash.mockRejectedValue(
        new Error('Hashing failed'),
      );

      await expect(authService.registerUser(registerDto)).rejects.toThrow(
        'Hashing failed',
      );
    });

    it('should handle database errors during save', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      mockUserModel.findOne().exec.mockResolvedValue(null);
      mockPasswordUtils.hash.mockResolvedValue('hashedPassword');

      const saveMock = jest.fn().mockRejectedValue(
        new Error('Failed to save user'),
      );
      mockUserModel.mockImplementation(() => ({
        save: saveMock,
      }));

      await expect(authService.registerUser(registerDto)).rejects.toThrow(
        'Failed to save user',
      );
    });

    it('should preserve all user data fields', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'John Doe',
      };

      mockUserModel.findOne().exec.mockResolvedValue(null);
      mockPasswordUtils.hash.mockResolvedValue('hashedPassword');

      const saveMock = jest.fn().mockResolvedValue(mockSavedUser);
      mockUserModel.mockImplementation(() => ({
        save: saveMock,
      }));

      const result = await authService.registerUser(registerDto);

      expect(result.user.name).toBe(mockSavedUser.name);
      expect(result.user.email).toBe(mockSavedUser.email);
    });

    it('should return correct response structure', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      mockUserModel.findOne().exec.mockResolvedValue(null);
      mockPasswordUtils.hash.mockResolvedValue('hashedPassword');

      const saveMock = jest.fn().mockResolvedValue(mockSavedUser);
      mockUserModel.mockImplementation(() => ({
        save: saveMock,
      }));

      const result = await authService.registerUser(registerDto);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('name');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('createdAt');
      expect(result.user).toHaveProperty('updatedAt');
    });

    it('should handle special characters in email', async () => {
      const registerDto: RegisterDto = {
        email: 'user+test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockUserModel.findOne().exec.mockResolvedValue(null);
      mockPasswordUtils.hash.mockResolvedValue('hashedPassword');

      const savedUser = {
        ...mockSavedUser,
        email: registerDto.email,
      };

      const saveMock = jest.fn().mockResolvedValue(savedUser);
      mockUserModel.mockImplementation(() => ({
        save: saveMock,
      }));

      const result = await authService.registerUser(registerDto);

      expect(result.success).toBe(true);
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should handle long names correctly', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'Very Long Name That Should Still Be Handled Correctly',
      };

      mockUserModel.findOne().exec.mockResolvedValue(null);
      mockPasswordUtils.hash.mockResolvedValue('hashedPassword');

      const savedUser = {
        ...mockSavedUser,
        name: registerDto.name,
      };

      const saveMock = jest.fn().mockResolvedValue(savedUser);
      mockUserModel.mockImplementation(() => ({
        save: saveMock,
      }));

      const result = await authService.registerUser(registerDto);

      expect(result.success).toBe(true);
      expect(result.user.name).toBe(registerDto.name);
    });
  });
});