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
  crearReferenciasWord?: boolean;
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  

  @IsOptional()
  @IsIn(['borrador', 'en_revision', 'completado'])
  estado?: string;

  @IsOptional()
  crearIndiceWord?: boolean;

  @IsString()
  @IsOptional()
  modulo_contenedor_id?: string; // NUEVO: módulo contenedor opcional
}
