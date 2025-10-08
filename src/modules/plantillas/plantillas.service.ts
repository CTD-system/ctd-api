import { Injectable } from '@nestjs/common';
import { CreatePlantillaDto } from './dto/create-plantilla.dto';
import { UpdatePlantillaDto } from './dto/update-plantilla.dto';

@Injectable()
export class PlantillasService {
  create(createPlantillaDto: CreatePlantillaDto) {
    return 'This action adds a new plantilla';
  }

  findAll() {
    return `This action returns all plantillas`;
  }

  findOne(id: number) {
    return `This action returns a #${id} plantilla`;
  }

  update(id: number, updatePlantillaDto: UpdatePlantillaDto) {
    return `This action updates a #${id} plantilla`;
  }

  remove(id: number) {
    return `This action removes a #${id} plantilla`;
  }
}
