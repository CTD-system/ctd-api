import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Body,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Multer } from 'multer';
import { MinioUploadService } from './minio-upload.service';
import path from 'path';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@ApiTags('MinIO - Subida a MinIO')
@ApiBearerAuth()
@Controller('minio-upload')
export class MinioUploadController {
  constructor(private readonly minioUploadService: MinioUploadService) {}

  // 📦 Subir expediente (.zip)
  // @Post('expediente')
  // @ApiOperation({ summary: 'Subir un expediente ZIP a MinIO y registrarlo en BD' })
  // @ApiConsumes('multipart/form-data')
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: { file: { type: 'string', format: 'binary' } },
  //   },
  // })
  // @ApiResponse({ status: 201, description: 'Expediente subido y registrado correctamente.' })
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: diskStorage({
  //       destination: 'uploads/expedientes',
  //       filename: (req, file, cb) => cb(null, file.originalname),
  //     }),
  //   }),
  // )
  // uploadExpediente(@UploadedFile() file: Multer.File) {
  //   return this.minioUploadService.uploadExpediente(file);
  // }

  @UseGuards(JwtAuthGuard)
@Post('upload/imagen')
@ApiOperation({ summary: 'Subir una imagen a MinIO y devolver URL pública' })
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: { type: 'string', format: 'binary' },
    },
  },
})
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: 'uploads/imagenes',
      filename: (req, file, cb) => cb(null, file.originalname),
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/'))
        return cb(
          new BadRequestException('Solo se aceptan imágenes'),
          false,
        );
      cb(null, true);
    },
  }),
)
async uploadImagen(@UploadedFile() file: Multer.File) {
  return this.minioUploadService.uploadImagen(file);
}




  // 📁 Subir módulo (.zip)
  @UseGuards(JwtAuthGuard)
  @Post('modulo')
@ApiOperation({ summary: 'Subir un módulo ZIP a MinIO y registrarlo en BD dentro de un expediente' })
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: { type: 'string', format: 'binary' },
      expedienteId: { type: 'string', example: 'uuid-expediente' },
    },
    required: ['file', 'expedienteId'],
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
async uploadModulo(
  @UploadedFile() file: Multer.File,
  @Body('expedienteId') expedienteId: string, // <-- aquí obtenemos el ID del expediente
) {
  if (!expedienteId) {
    throw new BadRequestException('Debe proporcionarse un expedienteId.');
  }
  return this.minioUploadService.uploadModulo(file, expedienteId);
}


  // 📄 Subir documentos (varios archivos)
  @UseGuards(JwtAuthGuard)
 @Post('documento')
@ApiOperation({
  summary: 'Subir uno o varios documentos a un módulo específico en MinIO y registrar en BD',
})
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      moduloId: {
        type: 'string',
        description: 'ID del módulo al que se asociarán los documentos',
        example: 'uuid-del-modulo',
      },
      files: {
        type: 'array',
        items: { type: 'string', format: 'binary' },
        description: 'Archivos a subir (máximo 20)',
      },
      tipos: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['plantilla', 'anexo', 'informe', 'otro'],
        },
        description: 'Tipos de documento correspondientes a cada archivo',
      },
    },
  },
})
@ApiResponse({
  status: 201,
  description: 'Documentos subidos correctamente al módulo y registrados en la base de datos.',
})
@UseInterceptors(
  FilesInterceptor('files', 20, {
    storage: diskStorage({
      destination: 'uploads/documentos',
      filename: (req, file, cb) => cb(null, file.originalname),
    }),
  }),
)
async uploadDocumentos(
  @CurrentUser() user: User,
  @UploadedFiles() files: Multer.File[],
  @Body('tipos') tipos: string[] | string,
  @Body('moduloId') moduloId: string,
 
) {

  if (!user || !user.id) {
    throw new UnauthorizedException('Usuario no autenticado');
  }
  if (!moduloId) {
    throw new BadRequestException('Debe proporcionar un módulo válido (moduloId).');
  }

  return this.minioUploadService.uploadDocumentos(files, tipos, moduloId, user.id);
}

  @UseGuards(JwtAuthGuard)
   @Post('import-ctd')
  @ApiOperation({ summary: 'Importar ZIP CTD: crear expediente/módulos/documentos y subir todo a MinIO' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Expediente importado y subido a MinIO correctamente.' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/imports', // carpeta temporal controlada
        filename: (req, file, cb) => {
          // conservar el nombre original para facilitar la lógica de extracción
          cb(null, file.originalname);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.zip') {
          return cb(new BadRequestException('Solo se aceptan archivos .zip'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 200 * 1024 * 1024, // opcional: límite 200MB (ajusta según necesidad)
      },
    }),
  )
  async importarCTD(@UploadedFile() file: Multer.File) {
    if (!file) {
      throw new BadRequestException('Se requiere un archivo ZIP válido.');
    }

    const zipPath = path.resolve(file.path);

    // Llamamos al servicio que extrae y sube a MinIO; el servicio debe encargarse
    // de limpiar el temporal (y en el código que te pasé el finally borra tmpDir).
    return await this.minioUploadService.importarCTD(zipPath);
  }

}
