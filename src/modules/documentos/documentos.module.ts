import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentosService } from './documentos.service';
import { DocumentosController } from './documentos.controller';
import { Documento } from './entities/documento.entity';
import { Modulo } from '../modulos/entities/modulo.entity';
import { User } from '../users/entities/user.entity';
import { HistorialModule } from '../historial/historial.module'; // ✅ agregado

@Module({
  imports: [TypeOrmModule.forFeature([Documento, Modulo, User]), HistorialModule],
  controllers: [DocumentosController],
  providers: [DocumentosService],
})
export class DocumentosModule {}
