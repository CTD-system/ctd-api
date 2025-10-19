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
import { ExpedientesService } from './expedientes.service';
import { CreateExpedienteDto } from './dto/create-expediente.dto';
import { UpdateExpedienteDto } from './dto/update-expediente.dto';

@ApiTags('Expedientes') // 👈 Agrupa en Swagger
@Controller('expedientes')
export class ExpedientesController {
  constructor(private readonly expedientesService: ExpedientesService) {}

  // 📘 Crear expediente
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo expediente' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['codigo', 'nombre'],
      properties: {
        codigo: {
          type: 'string',
          description: 'Código único del expediente',
          example: 'EXP-2025-001',
        },
        nombre: {
          type: 'string',
          description: 'Nombre descriptivo del expediente',
          example: 'Evaluación Ambiental del Proyecto Hidroeléctrico',
        },
        descripcion: {
          type: 'string',
          description: 'Descripción breve del expediente',
          example:
            'Expediente que contiene la documentación técnica y legal del proyecto.',
        },
        estado: {
          type: 'string',
          enum: ['borrador', 'en_revision', 'cerrado'],
          description: 'Estado actual del expediente',
          example: 'borrador',
        },
        creado_por: {
          type: 'string',
          format: 'uuid',
          description: 'ID del usuario que crea el expediente',
          example: 'b6f1e567-4f2c-4e1f-9a23-6a5e8d123456',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Expediente creado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Código duplicado o datos inválidos',
  })
  @ApiResponse({ status: 404, description: 'Usuario creador no encontrado' })
  create(@Body() createExpedienteDto: CreateExpedienteDto) {
    return this.expedientesService.create(createExpedienteDto);
  }

  // 📘 Obtener todos los expedientes
  @Get()
  @ApiOperation({ summary: 'Listar todos los expedientes con sus módulos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de expedientes retornada correctamente',
  })
  findAll() {
    return this.expedientesService.findAll();
  }

  // 📘 Obtener expediente por ID
  @Get(':id')
  @ApiOperation({ summary: 'Obtener los detalles de un expediente por su ID' })
  @ApiParam({ name: 'id', type: String, description: 'ID del expediente' })
  @ApiResponse({ status: 200, description: 'Expediente encontrado' })
  @ApiResponse({ status: 404, description: 'Expediente no encontrado' })
  findOne(@Param('id') id: string) {
    return this.expedientesService.findOne(id);
  }

  // 📘 Actualizar expediente
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar los datos de un expediente' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del expediente a actualizar',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: {
          type: 'string',
          example: 'Expediente de Impacto Ambiental 2025',
        },
        descripcion: {
          type: 'string',
          example: 'Actualización de los documentos técnicos',
        },
        estado: {
          type: 'string',
          enum: ['borrador', 'en_revision', 'cerrado'],
          example: 'en_revision',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Expediente actualizado correctamente',
  })
  @ApiResponse({ status: 404, description: 'Expediente no encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateExpedienteDto: UpdateExpedienteDto,
  ) {
    return this.expedientesService.update(id, updateExpedienteDto);
  }

  // 📘 Eliminar expediente
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un expediente por su ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del expediente a eliminar',
  })
  @ApiResponse({
    status: 200,
    description: 'Expediente eliminado correctamente',
  })
  @ApiResponse({ status: 404, description: 'Expediente no encontrado' })
  remove(@Param('id') id: string) {
    return this.expedientesService.remove(id);
  }

  // 📘 Asignar módulo a expediente
  @Post(':expedienteId/modulos/:moduloId')
  @ApiOperation({ summary: 'Asignar un módulo existente a un expediente' })
  @ApiParam({
    name: 'expedienteId',
    type: String,
    description: 'ID del expediente',
  })
  @ApiParam({
    name: 'moduloId',
    type: String,
    description: 'ID del módulo a asignar',
  })
  @ApiResponse({
    status: 200,
    description: 'Módulo asignado correctamente al expediente',
  })
  @ApiResponse({
    status: 404,
    description: 'Expediente o módulo no encontrado',
  })
  async asignarModulo(
    @Param('expedienteId') expedienteId: string,
    @Param('moduloId') moduloId: string,
  ) {
    return this.expedientesService.asignarModulo(expedienteId, moduloId);
  }

  // 📘 Eliminar expediente en cascada (con sus módulos y documentos)
  @Delete(':id/cascade')
  @ApiOperation({
    summary:
      'Eliminar un expediente junto con sus módulos y documentos asociados',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del expediente a eliminar en cascada',
  })
  @ApiResponse({
    status: 200,
    description: 'Expediente y sus módulos/documentos eliminados correctamente',
  })
  @ApiResponse({ status: 404, description: 'Expediente no encontrado' })
  async eliminarEnCascada(@Param('id') id: string) {
    return this.expedientesService.eliminarEnCascada(id);
  }
}
