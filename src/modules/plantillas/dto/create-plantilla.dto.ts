// src/plantillas/dto/create-plantilla.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePlantillaDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  tipo_archivo?: string;

  @IsOptional()
  @IsString()
  ruta_archivo?: string;

  @IsOptional()
  @IsUUID()
  modulo_id?: string;

  @IsOptional()
  @IsUUID()
  creado_por?: string;
}
