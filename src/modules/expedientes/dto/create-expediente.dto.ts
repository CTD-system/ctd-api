// src/expedientes/dto/create-expediente.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsIn, IsUUID } from 'class-validator';

export class CreateExpedienteDto {
  @IsNotEmpty()
  @IsString()
  codigo: string;

  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsIn(['borrador', 'en_revision', 'aprobado', 'enviado'])
  estado?: string;

  @IsOptional()
  @IsUUID()
  creado_por?: string;
}
