// src/historial/dto/create-historial.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsIn, IsInt } from 'class-validator';

export class CreateHistorialDto {
  @IsNotEmpty()
  @IsUUID()
  documento_id: string;

  @IsNotEmpty()
  @IsInt()
  version: number;

  @IsNotEmpty()
  @IsIn(['creado', 'modificado', 'eliminado', 'aprobado'])
  accion: string;

  @IsOptional()
  @IsUUID()
  usuario_id?: string;

  @IsOptional()
  @IsString()
  comentario?: string;
}
