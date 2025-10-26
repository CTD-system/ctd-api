import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { MinioExportController } from './minio-export.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expediente } from '../expedientes/entities/expediente.entity';
import { Documento } from '../documentos/entities/documento.entity';
import { Plantilla } from '../plantillas/entities/plantilla.entity';
import { MinioService } from '../minio.service';
import { MinioDownloadController } from './minio-download.controller';
import { MinioDownloadService } from './minio-download.service';

@Module({
  imports: [TypeOrmModule.forFeature([Expediente, Documento, Plantilla])],
  providers: [ExportService, MinioService,MinioDownloadService],
  controllers: [ExportController, MinioExportController,MinioDownloadController],
})
export class ExportModule {}
