import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
  IsObject,
  IsHexColor,
} from 'class-validator';
import { Type } from 'class-transformer';

// ---- Subestructuras auxiliares ----

// Definición de una tabla (encabezados + filas)
class TablaDto {
  @IsArray()
  @IsString({ each: true })
  encabezados: string[];

  @IsArray()
  @IsArray({ each: true })
  filas: string[][];
}

// Definición de un subcapítulo
class SubCapituloDto {
  @IsNotEmpty()
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  contenido?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TablaDto)
  tablas?: TablaDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  anexos?: string[];
}

// Definición de un capítulo principal
class CapituloDto {
  @IsNotEmpty()
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  contenido?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SubCapituloDto)
  subCapitulos?: SubCapituloDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TablaDto)
  tablas?: TablaDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  placeholders?: string[];
}

// ---- DTO principal ----
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

  // --- Configuración de documento Word ---

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  encabezado?: string;

  @IsOptional()
  @IsString()
  fuente?: string;

  @IsOptional()
  @IsInt()
  tamano_fuente?: number;

  @IsOptional()
  @IsHexColor()
  color_texto?: string;

  @IsOptional()
  @IsBoolean()
  tiene_tablas?: boolean;

  @IsOptional()
  @IsBoolean()
  autogenerar_indice?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CapituloDto)
  capitulos?: CapituloDto[];

  @IsOptional()
  @IsBoolean()
  incluir_anexos_en_subcapitulos?: boolean;
}
