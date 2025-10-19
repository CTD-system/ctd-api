import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { MinioImportController } from './minio-import.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Documento } from '../documentos/entities/documento.entity';
import { Plantilla } from '../plantillas/entities/plantilla.entity';
import { Expediente } from '../expedientes/entities/expediente.entity';
import { Modulo } from '../modulos/entities/modulo.entity';
import { MinioService } from '../minio.service';
import { MinioUploadController } from './minio-upload.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Documento, Plantilla, Expediente, Modulo]),
  ],
  providers: [ImportService, MinioService],
  controllers: [ImportController, MinioImportController,MinioUploadController],
})
export class ImportModule {}
