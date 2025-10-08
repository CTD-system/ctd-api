import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expediente } from '../expedientes/entities/expediente.entity';
import { Documento } from '../documentos/entities/documento.entity';
import { Plantilla } from '../plantillas/entities/plantilla.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expediente, Documento, Plantilla])],
  providers: [ExportService],
  controllers: [ExportController],
})
export class ExportModule {}
