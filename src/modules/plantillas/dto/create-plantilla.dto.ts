import { IsString, IsOptional, IsUUID, IsBoolean, IsArray, IsNumber, IsDate, IsNotEmpty, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { User } from 'src/modules/users/entities/user.entity';
import { UserDTO } from 'src/modules/users/dto/create-user.dto';

type BloqueDTO =
  | {
      tipo: 'capitulo' | 'subcapitulo';
      titulo: string;
      bloques?: BloqueDTO[];
    }
  | {
      tipo: 'parrafo';
      texto: string;
    }
  | {
      tipo: 'tabla';
      encabezados: string[];
      filas: string[][];
    }
  | {
      tipo: 'imagen';
      src: string;
      alt?: string;
    }
  | {
      tipo: 'placeholder';
      clave: string;
      descripcion?: string;
    };

export class PlantillaDTO {
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsOptional()
  @IsString()
  tipo_archivo?: string;

  @IsString()
  ruta_archivo: string;

   @Type(() => UserDTO) // Usamos UserDTO en lugar de User
  creado_por: UserDTO;

  @IsDate()
  creado_en: Date;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  encabezado?: string;

  @IsOptional()
  @IsString()
  pie_pagina?: string;

  @IsString()
  fuente: string;

  @IsNumber()
  tamano_fuente: number;

  @IsString()
  color_texto: string;

  @IsBoolean()
  tiene_tablas: boolean;

  @IsBoolean()
  autogenerar_indice: boolean;

  @IsOptional()
  @IsObject()
  estructura?: {
    tipo: 'documento';
    titulo?: string;
    bloques: BloqueDTO[];
  };

  @IsOptional()
  @IsObject()
  estilos_detectados?: {
    nombres_estilos?: string[];
    estilos_personalizados?: {
      nombre: string;
      fuente?: string;
      tamano_fuente?: number;
      color?: string;
      negrita?: boolean;
      cursiva?: boolean;
    }[];
  };
}
