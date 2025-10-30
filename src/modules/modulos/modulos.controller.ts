import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ModulosService } from './modulos.service';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';

@ApiTags('Módulos') // 👈 agrupa en Swagger
@Controller('modulos')
export class ModulosController {
  constructor(private readonly modulosService: ModulosService) {}

 // 📘 Crear módulo
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo módulo en un expediente o submódulo' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['expediente_id', 'numero'],
      properties: {
        expediente_id: {
          type: 'string',
          format: 'uuid',
          description: 'ID del expediente al que pertenece el módulo',
          example: 'f64a8e12-9f1a-44a1-a9e7-91dfb39bcd10',
        },
        titulo: {
          type: 'string',
          description: 'Título o nombre descriptivo del módulo',
          example: 'Marco Legal Ambiental',
        },
        descripcion: {
          type: 'string',
          description: 'Breve descripción del módulo',
          example: 'Contiene la normativa ambiental aplicable al proyecto.',
        },
        estado: {
          type: 'string',
          enum: ['borrador', 'en_revision', 'completado'],
          description: 'Estado actual del módulo',
          example: 'borrador',
        },
        crearIndiceWord: {
          type: 'boolean',
          description: 'Indica si se debe generar automáticamente el índice en Word',
          example: true,
        },
        crearReferenciasWord: {
          type: 'boolean',
          description: 'Indica si se debe generar automáticamente el archivo de referencias bibliográficas',
          example: false,
        },
        modulo_contenedor_id: {
          type: 'string',
          format: 'uuid',
          description: 'ID del módulo contenedor, si se desea crear un submódulo',
          example: 'a12b3c45-678d-90ef-12gh-3456ijkl7890',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Módulo creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Error en la validación de datos o expediente inexistente' })
  create(@Body() createModuloDto: CreateModuloDto) {
    return this.modulosService.create(createModuloDto);
  }

  // 📘 Listar módulos
  @Get()
  @ApiOperation({ summary: 'Listar todos los módulos con sus expedientes y documentos' })
  @ApiResponse({ status: 200, description: 'Lista de módulos retornada correctamente' })
  findAll() {
    return this.modulosService.findAll();
  }

  // 📘 Obtener módulo por ID
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de un módulo por su ID' })
  @ApiParam({ name: 'id', type: String, description: 'ID del módulo' })
  @ApiResponse({ status: 200, description: 'Módulo encontrado' })
  @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  findOne(@Param('id') id: string) {
    return this.modulosService.findOne(id);
  }

  // 📘 Actualizar módulo
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar los datos de un módulo existente' })
  @ApiParam({ name: 'id', type: String, description: 'ID del módulo a actualizar' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        titulo: { type: 'string', example: 'Marco Normativo Actualizado' },
        descripcion: { type: 'string', example: 'Incluye legislación vigente hasta 2025' },
        estado: {
          type: 'string',
          enum: ['borrador', 'en_revision', 'completado'],
          example: 'en_revision',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Módulo actualizado correctamente' })
  @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  update(@Param('id') id: string, @Body() updateModuloDto: UpdateModuloDto) {
    return this.modulosService.update(id, updateModuloDto);
  }

  // 📘 Eliminar módulo
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un módulo existente' })
  @ApiParam({ name: 'id', type: String, description: 'ID del módulo a eliminar' })
  @ApiResponse({ status: 200, description: 'Módulo eliminado correctamente' })
  @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  remove(@Param('id') id: string) {
    return this.modulosService.remove(id);
  }

  // 📘 Asignar documento a módulo
  @Post(':moduloId/documentos/:documentoId')
  @ApiOperation({ summary: 'Asignar un documento a un módulo' })
  @ApiParam({ name: 'moduloId', type: String, description: 'ID del módulo' })
  @ApiParam({ name: 'documentoId', type: String, description: 'ID del documento' })
  @ApiResponse({ status: 200, description: 'Documento asignado al módulo correctamente' })
  @ApiResponse({ status: 404, description: 'Módulo o documento no encontrado' })
  async asignarDocumento(
    @Param('moduloId') moduloId: string,
    @Param('documentoId') documentoId: string,
  ) {
    return this.modulosService.asignarDocumento(moduloId, documentoId);
  }

  // 📘 Editar referencias bibliográficas
  @Patch(':moduloId/referencias')
  @ApiOperation({ summary: 'Editar el archivo Word de referencias bibliográficas de un módulo' })
  @ApiParam({ name: 'moduloId', type: String, description: 'ID del módulo' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        referencias: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'Ministerio de Ambiente (2022). Informe anual.',
            'ONU (2021). Objetivos de Desarrollo Sostenible.',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo de referencias actualizado y subido a MinIO',
  })
  async editarReferenciasWord(
    @Param('moduloId') moduloId: string,
    @Body('referencias') referencias: string[],
  ) {
    return this.modulosService.editarReferenciasWord(moduloId, referencias);
  }
}
