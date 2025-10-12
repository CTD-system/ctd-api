import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { ExportService } from './export.service';
import express from 'express';
import * as fs from 'fs';
import path from 'path';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('ctd/:id')
  async exportarCTD(@Param('id') id: string, @Res() res: express.Response) {
    const result = await this.exportService.exportarCTD(id);
    const { zipPath } = result;

    if (!fs.existsSync(zipPath)) {
      return res.status(404).json({ message: 'Archivo ZIP no encontrado' });
    }

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename=${zipPath}`,
    });

    const fileStream = fs.createReadStream(zipPath);
    fileStream.pipe(res);
  }

   @Get('documento/:id')
  async exportarDocumento(@Param('id') id: string, @Res() res: express.Response) {
    const documento = await this.exportService.exportarDocumento(id);

    if (!documento || !fs.existsSync(documento.ruta_archivo)) {
      throw new NotFoundException('Documento no encontrado');
    }

    const filename = path.basename(documento.ruta_archivo);

    res.set({
      'Content-Type': documento.mime_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    const fileStream = fs.createReadStream(documento.ruta_archivo);
    fileStream.pipe(res);
  }
}
