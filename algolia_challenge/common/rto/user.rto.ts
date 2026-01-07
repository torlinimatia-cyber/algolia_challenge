import { ApiProperty } from '@nestjs/swagger';

export class UserRto {
  @ApiProperty({
    description: 'The unique identifier of the user',
    example: '679c8a1b123456789abcdef0',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john@example.com',
  })
  email: string;
  createdAt: Date;
  updatedAt: Date;
}