import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { MinioExportController } from './minio-export.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expediente } from '../expedientes/entities/expediente.entity';
import { Documento } from '../documentos/entities/documento.entity';
import { Plantilla } from '../plantillas/entities/plantilla.entity';
import { MinioService } from '../minio.service';
import { MinioDownloadController } from './minio-download.controller';
import { MinioDownloadService } from './minio-download.service';
import { Modulo } from '../modulos/entities/modulo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expediente, Documento, Plantilla,Modulo])],
  providers: [ExportService, MinioService,MinioDownloadService],
  controllers: [ MinioExportController,MinioDownloadController],
})
export class ExportModule {}
