import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import { Multer } from 'multer';
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

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
}
