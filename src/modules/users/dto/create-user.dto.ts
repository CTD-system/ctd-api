// src/users/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsIn, IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';
import { Exclude, Expose } from 'class-transformer';


export class UserDTO {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

  
}
export class CreateUserDto {
  @ApiProperty({ example: 'juanperez', description: 'Nombre de usuario único' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'juan@aica.cu', description: 'Correo electrónico del usuario' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: 'Contraseña del usuario' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
