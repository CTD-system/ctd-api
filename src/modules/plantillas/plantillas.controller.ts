import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PlantillasService } from './plantillas.service';
import { CreatePlantillaDto } from './dto/create-plantilla.dto';
import { UpdatePlantillaDto } from './dto/update-plantilla.dto';

@Controller('plantillas')
export class PlantillasController {
  constructor(private readonly plantillasService: PlantillasService) {}

  @Post()
  create(@Body() createPlantillaDto: CreatePlantillaDto) {
    return this.plantillasService.create(createPlantillaDto);
  }

  @Get()
  findAll() {
    return this.plantillasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plantillasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlantillaDto: UpdatePlantillaDto) {
    return this.plantillasService.update(+id, updatePlantillaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plantillasService.remove(+id);
  }
}
