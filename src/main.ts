import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  const config = new DocumentBuilder()
    .setTitle('CTD AICA API')
    .setDescription('API de gestión de expedientes CTD para AICA')
    .setVersion('1.0')
    .addBearerAuth() // para JWT
    .build();

    const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('ctd/docs', app, document); // ruta: http://localhost:4000/api/docs

  await app.listen(process.env.APP_PORT || 4000);
}
bootstrap();
