import { ApiProperty } from "@nestjs/swagger";

export class LoginUserRto {
    @ApiProperty({ example: true })
    success: boolean;
  
    @ApiProperty({ example: 'Login successful' })
    message: string;
  
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    token: string;
  }