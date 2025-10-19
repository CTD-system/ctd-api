import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { MinioService } from '../minio.service';
import * as path from 'path';
import * as fs from 'fs';
import express from 'express';

@ApiTags('MinIO Exportación')
@Controller('minio-export')
export class MinioExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly minioService: MinioService,
  ) {}

  @Get('ctd/:id')
  @ApiOperation({ summary: 'Exportar un expediente CTD a MinIO y descargarlo' })
  @ApiParam({ name: 'id', description: 'ID del expediente a exportar', example: '12345' })
  @ApiResponse({ status: 200, description: 'Archivo ZIP generado y descargado correctamente.' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado en MinIO.' })
  async exportarCTDMinio(@Param('id') id: string, @Res() res: express.Response) {
   const result = await this.exportService.exportarCTD(id) as { zipPath: string; message?: string };
       const { zipPath, message } = result;
   
       if (!fs.existsSync(zipPath)) {
         throw new NotFoundException('Archivo ZIP no encontrado.');
       }

    const bucket = 'ctd-exports';
    const fileName = path.basename(zipPath);

    // Subir el ZIP a MinIO
    await this.minioService.uploadFile(bucket, fileName, zipPath);

    // Descargar desde MinIO (opcional, para servirlo al usuario)
    const downloadPath = path.join('exports', fileName);
    await this.minioService.downloadFile(bucket, fileName, downloadPath);

    // Enviar el archivo al cliente
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename=${fileName}`,
    });
    fs.createReadStream(downloadPath).pipe(res);
  }
}
