import {
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import { Multer } from 'multer';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam } from '@nestjs/swagger';
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @ApiOperation({
    summary: 'Importar un expediente CTD con modulos y documentos asignados',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('ctd')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const filename = `${Date.now()}_${file.originalname}`;
          cb(null, filename);
        },
      }),
    }),
  )
  async importarCTD(@UploadedFile() file: Multer.File) {
    const filePath = path.join('uploads', file.filename);
    return this.importService.importarCTD(filePath);
  }

 
 @Post('documento')
  @ApiOperation({ summary: 'Importar un documento o ZIP con un solo archivo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de documento o ZIP con un solo archivo dentro',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/documentos',
      filename: (req, file, cb) => {
        const filename = `${Date.now()}_${file.originalname}`;
        cb(null, filename);
      },
    }),
  }))
  async importarDocumento(@UploadedFile() file: Multer.File) {
    return this.importService.importarDocumento(file);
  }

  @ApiOperation({
    summary:
      'Importar un módulo con documentos dentro de un expediente existente',
  })
  @ApiParam({
    name: 'expedienteId',
    description: 'ID del expediente destino',
    example: '45',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo ZIP del módulo con documentos',
        },
      },
    },
  })
  @Post('modulo/:expedienteId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/modulos',
        filename: (req, file, cb) => {
          const filename = `${Date.now()}_${file.originalname}`;
          cb(null, filename);
        },
      }),
    }),
  )
  async importarModulo(
    @Param('expedienteId') expedienteId: string,
    @UploadedFile() file: Multer.File,
  ) {
    return this.importService.importarModulo(file, expedienteId);
  }
}
