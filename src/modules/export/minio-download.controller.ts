import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { MinioService } from '../minio.service';
import * as path from 'path';
import * as fs from 'fs';
import express  from 'express';
import { ExportService } from './export.service';
@ApiTags('MinIO - Descarga directa')
@Controller('minio-download')
export class MinioDownloadController {
  constructor(private readonly minioService: MinioService,
    private readonly exportService: ExportService
  ) {}

  // 📦 Descargar expediente ZIP desde MinIO
  @Get('expediente/:filename')
  @ApiOperation({ summary: 'Descargar un expediente ZIP directamente desde MinIO' })
  @ApiParam({ name: 'filename', example: 'expediente_12345.zip' })
  @ApiResponse({ status: 200, description: 'Archivo descargado correctamente.' })
  async descargarExpediente(@Param('filename') filename: string, @Res() res: express.Response) {
    if (!filename.endsWith('.zip')) {
      throw new BadRequestException('Solo se pueden descargar archivos .zip en esta ruta.');
    }
    return this.descargarDesdeMinio('ctd-imports', filename, res);
  }

  // 📁 Descargar módulo ZIP desde MinIO
  @Get('modulo/:filename')
  @ApiOperation({ summary: 'Descargar un módulo ZIP directamente desde MinIO' })
  @ApiParam({ name: 'filename', example: 'modulo_1.zip' })
  async descargarModulo(@Param('filename') filename: string, @Res() res: express.Response) {
    if (!filename.endsWith('.zip')) {
      throw new BadRequestException('Solo se pueden descargar archivos .zip en esta ruta.');
    }
    return this.descargarDesdeMinio('ctd-imports', filename, res);
  }

  // 📄 Descargar documento (no ZIP)
  @Get('documento/:filename')
  @ApiOperation({ summary: 'Descargar un documento individual desde MinIO (no ZIP)' })
  @ApiParam({ name: 'filename', example: 'informe_final.docx' })
  async descargarDocumento(@Param('filename') filename: string, @Res() res: express.Response) {
    if (filename.endsWith('.zip')) {
      throw new BadRequestException('Los documentos no pueden ser archivos ZIP.');
    }
    return this.descargarDesdeMinio('ctd-imports', filename, res);
  }

  @Get('expediente-zip/:expedienteId')
  @ApiOperation({ summary: 'Descargar todo un expediente (carpeta completa) como ZIP desde MinIO' })
  @ApiParam({ name: 'expedienteId', example: 'c7971cae-9127-4ee1-99e6-8aec031a08d6' })
  async descargarExpedienteCompleto(
    @Param('expedienteId') expedienteId: string,
    @Res() res: express.Response,
  ) {
    return this.exportService.descargarExpedienteCompleto(expedienteId, res);
  }

  

  /**
   * Método reutilizable para descargar un archivo desde MinIO y enviarlo al cliente.
   */
  private async descargarDesdeMinio(bucket: string, filename: string, res: express.Response) {
    const decodedName = Buffer.from(filename, 'latin1').toString('utf8');
    const safeName = decodedName.replace(/[\\/:*?"<>|]/g, '').trim();

    const downloadPath = path.join('downloads', safeName);
    fs.mkdirSync(path.dirname(downloadPath), { recursive: true });

    try {
      await this.minioService.downloadFile(bucket, filename, downloadPath);
    } catch {
      throw new NotFoundException('Archivo no encontrado en MinIO.');
    }

    if (!fs.existsSync(downloadPath)) {
      throw new NotFoundException('No se pudo descargar el archivo desde MinIO.');
    }

    const mimeType = this.detectMimeType(safeName);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${safeName}"`,
    });

    const stream = fs.createReadStream(downloadPath);
    stream.pipe(res);
  }

  private detectMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.zip': return 'application/zip';
      case '.pdf': return 'application/pdf';
      case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case '.doc': return 'application/msword';
      case '.txt': return 'text/plain';
      default: return 'application/octet-stream';
    }
  }
}
