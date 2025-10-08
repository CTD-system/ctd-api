import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entitys/user.entity';
import { Expediente } from './entitys/expediente.entity';
import { Modulo } from './entitys/modulo.entity';
import { Documento } from './entitys/documento.entity';
import { HistorialDocumento } from './entitys/historial_documento.entity';
import { Notificacion } from './entitys/notificacion.entity';
import { Plantilla } from './entitys/plantilla.entity';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'ctd',
      entities: [User, Expediente, Modulo, Documento, HistorialDocumento, Notificacion, Plantilla],
      synchronize: true, // Solo para desarrollo
    }),
    TypeOrmModule.forFeature([
      User, Expediente, Modulo, Documento, HistorialDocumento, Notificacion, Plantilla
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
