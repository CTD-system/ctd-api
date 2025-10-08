import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './modules/users/entities/user.entity';
import { Expediente } from './modules/expedientes/entities/expediente.entity';
import { Modulo } from './modules/modulos/entities/modulo.entity';
import { Documento } from './modules/documentos/entities/documento.entity';
import { HistorialDocumento } from './modules/historial/entities/historial_documento.entity';
import { Plantilla } from './modules/plantillas/entities/plantilla.entity';
import { AuthModule } from './modules/auth/auth.module';
import { ImportModule } from './modules/import/import.module';
import { ExportModule } from './modules/export/export.module';
import { UsersModule } from './modules/users/users.module';
import { ExpedientesModule } from './modules/expedientes/expedientes.module';
import { ModulosModule } from './modules/modulos/modulos.module';
import { DocumentosModule } from './modules/documentos/documentos.module';
import { PlantillasModule } from './modules/plantillas/plantillas.module';
import { HistorialModule } from './modules/historial/historial.module';


@Module({
  imports: [
    // Configuración global del .env
    ConfigModule.forRoot({ isGlobal: true }),

    // Conexión a la base de datos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true,
        entities: [User, Expediente, Modulo, Documento, HistorialDocumento, Plantilla],
        synchronize: true, // ⚠️ Solo en desarrollo
      }),
      inject: [ConfigService],
    }),

    // Módulos funcionales
    AuthModule,
    ImportModule,
    ExportModule,
    UsersModule,
    ExpedientesModule,
    ModulosModule,
    DocumentosModule,
    PlantillasModule,
    HistorialModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
