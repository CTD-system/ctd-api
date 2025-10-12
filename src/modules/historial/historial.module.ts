import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistorialService } from './historial.service';
import { HistorialController } from './historial.controller';
import { HistorialDocumento } from './entities/historial_documento.entity';
import { Documento } from '../documentos/entities/documento.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HistorialDocumento, Documento, User])],
  controllers: [HistorialController],
  providers: [HistorialService],
  exports: [HistorialService],
})
export class HistorialModule {}
