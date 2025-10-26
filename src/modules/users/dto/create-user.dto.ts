// src/users/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsIn, IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';
import { Exclude, Expose } from 'class-transformer';
import { UUID } from 'typeorm/driver/mongodb/bson.typings.js';


export class UserDTO {
  @Expose()
  @ApiProperty({
    description: 'ID del usuario que creo la plantilla',
    example: '3418a522-4588-45c5-81a6-1073e052d2bd',
    type: UUID,
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'Nombre del usuario que creo la plantilla',
    example: 'Juan',
    type: String,
  })
  username: string;

  @Expose()
  @ApiProperty({
    description: 'Email del usuario que creo la plantilla',
    example: 'juan@correo.com',
    type: IsEmail,
  })
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
