import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Documento } from '../documentos/entities/documento.entity';
import { Plantilla } from '../plantillas/entities/plantilla.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Documento, Plantilla])],
  providers: [ImportService],
  controllers: [ImportController],
})
export class ImportModule {}
