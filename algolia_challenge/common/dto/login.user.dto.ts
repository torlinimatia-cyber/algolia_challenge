import { 
    IsEmail, 
    IsNotEmpty, 
    IsString, 
  } from 'class-validator';
  
  import { ApiProperty } from '@nestjs/swagger';
  
  export class LoginDto {
    @ApiProperty({
      description: 'Email of the user',
      example: 'john@algolia.com',
    })
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;
  
    @ApiProperty({
      description: 'The password for the user account',
      example: 'SecurePass123',
    })
    @IsNotEmpty({ message: 'Password is required' })
    @IsString({ message: 'Password must be a string' })
    password: string;
  }