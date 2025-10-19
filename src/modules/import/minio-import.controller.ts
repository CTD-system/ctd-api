import {
  Controller,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { ImportService } from './import.service';
import { MinioService } from '../minio.service';
import { ImportarMinioDto } from './dto/import-minio.dto';
import * as path from 'path';
import * as fs from 'fs';
import { Multer } from 'multer';

@ApiTags('MinIO - Importación desde MinIO')
@Controller('minio-import')
export class MinioImportController {
  constructor(
    private readonly importService: ImportService,
    private readonly minioService: MinioService,
  ) {}

  // 📦 Importar expediente CTD desde un ZIP en MinIO
  @Post('expediente')
  @ApiOperation({ summary: 'Importar un expediente CTD desde MinIO (.zip)' })
  @ApiBody({ type: ImportarMinioDto })
  @ApiResponse({ status: 201, description: 'Expediente importado correctamente.' })
  async importarExpedienteMinio(@Body() body: ImportarMinioDto) {
    const bucket = 'ctd-imports';
    const { minioFileName } = body;

    if (!minioFileName.endsWith('.zip')) {
      throw new BadRequestException('El expediente debe ser un archivo .zip');
    }

    const downloadPath = path.join('uploads', `expediente_${Date.now()}.zip`);
    await this.minioService.downloadFile(bucket, minioFileName, downloadPath);

    return this.importService.importarCTD(downloadPath);
  }

  // 📁 Importar módulo ZIP desde MinIO
  @Post('modulo')
  @ApiOperation({ summary: 'Importar un módulo ZIP desde MinIO' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        expedienteId: { type: 'string' },
        minioFileName: { type: 'string' },
      },
      required: ['expedienteId', 'minioFileName'],
    },
  })
  async importarModuloMinio(
    @Body() body: { expedienteId: string; minioFileName: string },
  ) {
    const bucket = 'ctd-imports';
    const { expedienteId, minioFileName } = body;

    if (!minioFileName.endsWith('.zip')) {
      throw new BadRequestException('El módulo debe ser un archivo .zip');
    }

    const downloadPath = path.join('uploads', `modulo_${Date.now()}.zip`);
    await this.minioService.downloadFile(bucket, minioFileName, downloadPath);

    return this.importService.importarModulo(
      { path: downloadPath, originalname: minioFileName } as Multer.File,
      expedienteId,
    );
  }

  // 📄 Importar documento individual (no ZIP)
  @Post('documento')
  @ApiOperation({ summary: 'Importar un documento individual desde MinIO (no ZIP)' })
  @ApiBody({ type: ImportarMinioDto })
  async importarDocumentoMinio(@Body() body: ImportarMinioDto) {
    const bucket = 'ctd-imports';
    const { minioFileName } = body;

    if (minioFileName.endsWith('.zip')) {
      throw new BadRequestException('No se permiten archivos ZIP aquí.');
    }

    const decodedName = Buffer.from(minioFileName, 'latin1').toString('utf8');
    const safeName = decodedName.replace(/[\\/:*?"<>|]/g, '').trim();

    const downloadPath = path.join('uploads', 'documentos', safeName);
    fs.mkdirSync(path.dirname(downloadPath), { recursive: true });

    await this.minioService.downloadFile(bucket, minioFileName, downloadPath);

    return this.importService.importarDocumento({
      path: downloadPath,
      originalname: safeName,
      filename: safeName,
      mimetype: this.detectMimeType(safeName),
    } as Multer.File);
  }

  private detectMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.pdf':
        return 'application/pdf';
      case '.docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case '.doc':
        return 'application/msword';
      default:
        return 'application/octet-stream';
    }
  }
}
