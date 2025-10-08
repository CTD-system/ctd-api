import { Module } from '@nestjs/common';
import { PlantillasService } from './plantillas.service';
import { PlantillasController } from './plantillas.controller';

@Module({
  controllers: [PlantillasController],
  providers: [PlantillasService],
})
export class PlantillasModule {}
