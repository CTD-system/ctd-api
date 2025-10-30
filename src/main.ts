import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
   app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // dominio del frontend
    credentials: true, // permite el uso de cookies o encabezados de autorización
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  const config = new DocumentBuilder()
    .setTitle('CTD AICA API')
    .setDescription('API de gestión de expedientes CTD para AICA')
    .setVersion('1.0')
    .addBearerAuth() // para JWT
    .build();

    const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('ctd/docs', app, document,{
    swaggerOptions: {
      docExpansion: 'none', // 👈 Las tags aparecen cerradas por defecto
      operationsSorter: 'alpha', // Opcional: ordena alfabéticamente los endpoints
      tagsSorter: 'alpha', // Opcional: ordena las tags alfabéticamente
    },
  }); // ruta: http://localhost:4000/api/docs

  await app.listen(process.env.APP_PORT || 4000);
}
bootstrap();
