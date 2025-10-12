import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModulosService } from './modulos.service';
import { ModulosController } from './modulos.controller';
import { Modulo } from './entities/modulo.entity';
import { Expediente } from '../expedientes/entities/expediente.entity';
import { Documento } from '../documentos/entities/documento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Modulo, Expediente, Documento])],
  controllers: [ModulosController],
  providers: [ModulosService],
  exports: [ModulosService],
})
export class ModulosModule {}
