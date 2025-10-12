import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpedientesService } from './expedientes.service';
import { ExpedientesController } from './expedientes.controller';
import { Expediente } from './entities/expediente.entity';
import { User } from '../users/entities/user.entity';
import { Modulo } from '../modulos/entities/modulo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expediente, User, Modulo])],
  controllers: [ExpedientesController],
  providers: [ExpedientesService],
  exports: [ExpedientesService],
})
export class ExpedientesModule {}
