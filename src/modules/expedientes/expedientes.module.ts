import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpedientesService } from './expedientes.service';
import { ExpedientesController } from './expedientes.controller';
import { Expediente } from './entities/expediente.entity';
import { User } from '../users/entities/user.entity';
import { Modulo } from '../modulos/entities/modulo.entity';
import { Documento } from '../documentos/entities/documento.entity';
import { MinioService } from '../minio.service';

@Module({
  imports: [TypeOrmModule.forFeature([Expediente,Documento, User, Modulo])],
  controllers: [ExpedientesController],
  providers: [ExpedientesService,MinioService],
  exports: [ExpedientesService],
})
export class ExpedientesModule {}
