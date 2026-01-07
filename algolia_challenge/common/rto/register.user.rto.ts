import { ApiProperty } from '@nestjs/swagger';
import { UserRto } from './user.rto';

export class RegisterRto {
  @ApiProperty({
    description: 'Indicates if the registration was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'A message describing the result of the registration',
    example: 'User registered successfully',
  })
  message: string;

  @ApiProperty({
    description: 'The registered user data (only present on success)',
    type: UserRto,
    required: false,
    nullable: true,
  })
  user?: UserRto;
}