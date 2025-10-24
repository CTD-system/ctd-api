import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlantillasService } from './plantillas.service';
import { PlantillasController } from './plantillas.controller';
import { Plantilla } from './entities/plantilla.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    // 👇 Importamos los repositorios usados en el servicio
    TypeOrmModule.forFeature([Plantilla, User]),
  ],
  controllers: [PlantillasController],
  providers: [PlantillasService],
  exports: [PlantillasService], // 👈 Exporta el servicio si otros módulos lo requieren
})
export class PlantillasModule {}
