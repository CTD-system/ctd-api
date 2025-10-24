import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Multer } from 'multer';
import { MinioUploadService } from './minio-upload.service';

@ApiTags('MinIO - Subida a MinIO')
@Controller('minio-upload')
export class MinioUploadController {
  constructor(private readonly minioUploadService: MinioUploadService) {}

  // 📦 Subir expediente (.zip)
  @Post('expediente')
  @ApiOperation({ summary: 'Subir un expediente ZIP a MinIO y registrarlo en BD' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Expediente subido y registrado correctamente.' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/expedientes',
        filename: (req, file, cb) => cb(null, file.originalname),
      }),
    }),
  )
  uploadExpediente(@UploadedFile() file: Multer.File) {
    return this.minioUploadService.uploadExpediente(file);
  }

  // 📁 Subir módulo (.zip)
  @Post('modulo')
  @ApiOperation({ summary: 'Subir un módulo ZIP a MinIO y registrarlo en BD' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        expedienteId: { type: 'string', example: 'uuid-expediente' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Módulo subido y registrado correctamente.' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/modulos',
        filename: (req, file, cb) => cb(null, file.originalname),
      }),
    }),
  )
  uploadModulo(@UploadedFile() file: Multer.File) {
    return this.minioUploadService.uploadModulo(file);
  }

  // 📄 Subir documentos (varios archivos)
  @Post('documento')
  @ApiOperation({
    summary: 'Subir uno o varios documentos a MinIO y registrar en BD con detección automática de anexos',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        tipos: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['plantilla', 'anexo', 'informe', 'otro'],
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Documentos subidos y registrados correctamente.' })
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: 'uploads/documentos',
        filename: (req, file, cb) => cb(null, file.originalname),
      }),
    }),
  )
  uploadDocumentos(
    @UploadedFiles() files: Multer.File[],
    @Body('tipos') tipos: string[] | string,
  ) {
    return this.minioUploadService.uploadDocumentos(files, tipos);
  }
}
