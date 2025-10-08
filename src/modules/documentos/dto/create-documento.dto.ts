// src/documentos/dto/create-documento.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsIn, IsInt, IsUUID } from 'class-validator';

export class CreateDocumentoDto {
  @IsNotEmpty()
  @IsUUID()
  modulo_id: string;

  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsIn(['plantilla', 'anexo', 'informe', 'otro'])
  tipo?: string;

  @IsOptional()
  @IsInt()
  version?: number;

  @IsOptional()
  @IsString()
  ruta_archivo?: string;

  @IsOptional()
  @IsString()
  mime_type?: string;

  @IsOptional()
  @IsUUID()
  subido_por?: string;

  @IsOptional()
  @IsUUID()
  plantilla_id?: string;
}
