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
import { MinioUploadService } from './minio-upload.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Documento, Plantilla, Expediente, Modulo,User]),
  ],
  providers: [ImportService, MinioService,MinioUploadService],
  controllers: [ImportController, MinioImportController,MinioUploadController],
})
export class ImportModule {}
