import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import { Multer } from 'multer';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

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
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const filename = `${Date.now()}_${file.originalname}`;
        cb(null, filename);
      },
    }),
  }))
  async importarCTD(@UploadedFile() file: Multer.File) {
    const filePath = path.join('uploads', file.filename);
    return this.importService.importarCTD(filePath);
  }


  @Post('upload')
@UseInterceptors(FileInterceptor('file', {
  storage: diskStorage({
    destination: './uploads/documentos',
    filename: (req, file, cb) => {
      const filename = `${Date.now()}_${file.originalname}`;
      cb(null, filename);
    },
  }),
}))
async uploadDocumento(@UploadedFile() file: Multer.File) {
  return this.importService.importarDocumento(file);
}

}
