// src/modulos/dto/create-modulo.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsIn, IsInt, IsUUID } from 'class-validator';

export class CreateModuloDto {
  @IsNotEmpty()
  @IsUUID()
  expediente_id: string;

  @IsNotEmpty()
  @IsInt()
  numero: number;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsIn(['borrador', 'en_revision', 'completado'])
  estado?: string;
}
