import { Controller, Get, Param, Res } from '@nestjs/common';
import { ExportService } from './export.service';
import express from 'express';
import * as fs from 'fs';

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
}
