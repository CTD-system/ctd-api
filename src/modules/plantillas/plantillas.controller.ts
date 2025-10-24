import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PlantillasService } from './plantillas.service';
import { CreatePlantillaDto } from './dto/create-plantilla.dto';
import { UpdatePlantillaDto } from './dto/update-plantilla.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Plantillas') // Agrupa las rutas en Swagger
@Controller('plantillas')
export class PlantillasController {
  constructor(private readonly plantillasService: PlantillasService) {}

  // ---- CREAR PLANTILLA ----
  @Post()
  @ApiOperation({
    summary: 'Crear una nueva plantilla',
    description:
      'Crea una plantilla de documento Word con configuración completa (fuente, color, capítulos, etc.)',
  })
  @ApiBody({ type: CreatePlantillaDto })
  @ApiResponse({
    status: 201,
    description: 'Plantilla creada correctamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación o datos inválidos',
  })
  create(@Body() createPlantillaDto: CreatePlantillaDto) {
    return this.plantillasService.create(createPlantillaDto);
  }

  // ---- LISTAR TODAS ----
  @Get()
  @ApiOperation({
    summary: 'Listar todas las plantillas',
    description: 'Devuelve todas las plantillas registradas en el sistema',
  })
  @ApiResponse({ status: 200, description: 'Listado obtenido correctamente' })
  findAll() {
    return this.plantillasService.findAll();
  }

  // ---- OBTENER UNA ----
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una plantilla por su ID',
    description: 'Retorna los datos completos de una plantilla por UUID',
  })
  @ApiParam({ name: 'id', description: 'UUID de la plantilla', type: 'string' })
  @ApiResponse({ status: 200, description: 'Plantilla encontrada' })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
  findOne(@Param('id') id: string) {
    return this.plantillasService.findOne(id);
  }

  // ---- ACTUALIZAR ----
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una plantilla',
    description:
      'Permite modificar los metadatos o configuración de una plantilla existente',
  })
  @ApiParam({ name: 'id', description: 'UUID de la plantilla', type: 'string' })
  @ApiBody({ type: UpdatePlantillaDto })
  @ApiResponse({ status: 200, description: 'Plantilla actualizada' })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
  update(@Param('id') id: string, @Body() updatePlantillaDto: UpdatePlantillaDto) {
    return this.plantillasService.update(id, updatePlantillaDto);
  }

  // ---- ELIMINAR ----
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una plantilla',
    description: 'Elimina permanentemente una plantilla por UUID',
  })
  @ApiParam({ name: 'id', description: 'UUID de la plantilla', type: 'string' })
  @ApiResponse({ status: 200, description: 'Plantilla eliminada correctamente' })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
  remove(@Param('id') id: string) {
    return this.plantillasService.remove(id);
  }
}
