import { Controller, Get, Post, Body, Param, Delete, Put, Query, NotFoundException } from '@nestjs/common';
import { PlantillasService } from './plantillas.service';
import { PlantillaDTO } from './dto/create-plantilla.dto';
import { UpdatePlantillaDto } from './dto/update-plantilla.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from '../users/entities/user.entity'; // Asegúrate de que esta entidad esté bien importada
import { CurrentUser } from 'src/decorators/current-user.decorator';

@ApiTags('Plantillas')
@Controller('plantillas')
export class PlantillasController {
  constructor(private readonly plantillasService: PlantillasService) {}

  // Crear una plantilla
  @Post()
  @ApiOperation({ summary: 'Crear una nueva plantilla' })
  @ApiResponse({
    status: 201,
    description: 'Plantilla creada correctamente',
    type: PlantillaDTO,
  })
  async create(
    @Body() createPlantillaDTO: PlantillaDTO,
    @CurrentUser() user: User,  // Usamos el decorador `CurrentUser` para obtener el usuario actual (requiere configuración adicional)
  ): Promise<PlantillaDTO> {
    return this.plantillasService.create(createPlantillaDTO, user.id);
  }

  // Obtener todas las plantillas
  @Get()
  @ApiOperation({ summary: 'Obtener todas las plantillas' })
  @ApiResponse({
    status: 200,
    description: 'Todas las plantillas obtenidas correctamente',
    type: [PlantillaDTO],
  })
  async findAll(): Promise<PlantillaDTO[]> {
    return this.plantillasService.findAll();
  }

  // Obtener una plantilla por su ID
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una plantilla por su ID' })
  @ApiResponse({
    status: 200,
    description: 'Plantilla obtenida correctamente',
    type: PlantillaDTO,
  })
  @ApiResponse({
    status: 404,
    description: 'Plantilla no encontrada',
  })
  async findOne(@Param('id') id: string): Promise<PlantillaDTO> {
    try {
      return await this.plantillasService.findOne(id);
    } catch (error) {
      throw new NotFoundException(`Plantilla con ID ${id} no encontrada`);
    }
  }

  // Actualizar una plantilla
  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una plantilla existente' })
  @ApiResponse({
    status: 200,
    description: 'Plantilla actualizada correctamente',
    type: PlantillaDTO,
  })
  @ApiResponse({
    status: 404,
    description: 'Plantilla no encontrada',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePlantillaDTO: UpdatePlantillaDto,
  ): Promise<PlantillaDTO> {
    return this.plantillasService.update(id, updatePlantillaDTO);
  }

  // Eliminar una plantilla
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una plantilla' })
  @ApiResponse({
    status: 204,
    description: 'Plantilla eliminada correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Plantilla no encontrada',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.plantillasService.remove(id);
  }
}
