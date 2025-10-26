import { IsString, IsOptional, IsUUID, IsBoolean, IsArray, IsNumber, IsDate, IsNotEmpty, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';  // Decorador para Swagger
import { UserDTO } from 'src/modules/users/dto/create-user.dto';
import { User } from 'src/modules/users/entities/user.entity';

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
  
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Nombre de la plantilla',
    example: 'Plantilla de contrato',
  })
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Descripción de la plantilla',
    example: 'Plantilla para generar contratos de trabajo',
  })
  descripcion: string;

  @IsOptional()
  @IsString()
  tipo_archivo?: string;


  @IsOptional()
creado_por?: any; // o User si quieres mantener el tipo

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Título de la plantilla (opcional)',
    example: 'Plantilla de ejemplo',
    nullable: true,
  })
  titulo?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Encabezado de la plantilla (opcional)',
    example: 'Encabezado de ejemplo',
    nullable: true,
  })
  encabezado?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Pie de página de la plantilla (opcional)',
    example: 'Pie de página de ejemplo',
    nullable: true,
  })
  pie_pagina?: string;

  @IsString()
  @ApiProperty({
    description: 'Fuente utilizada en la plantilla',
    example: 'Arial',
  })
  fuente: string;

  @IsNumber()
  @ApiProperty({
    description: 'Tamaño de fuente de la plantilla',
    example: 12,
  })
  tamano_fuente: number;

  @IsString()
  @ApiProperty({
    description: 'Color del texto de la plantilla en formato hexadecimal',
    example: '#000000',
  })
  color_texto: string;


  @IsBoolean()
  @ApiProperty({
    description: 'Indica si la plantilla generará índice automáticamente',
    example: false,
  })
  autogenerar_indice: boolean;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Estructura interna de la plantilla (opcional)',
    nullable: true,
    example: {
      tipo: 'documento',
      titulo: 'Estructura ejemplo',
      bloques: [
        {
          tipo: 'capitulo',
          titulo: 'Capítulo 1',
          bloques: [
            { tipo: 'parrafo', texto: 'Texto del párrafo 1' },
          ],
        },
      ],
    },
  })
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
