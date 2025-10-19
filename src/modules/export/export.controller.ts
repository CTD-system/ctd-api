import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  Header,
} from '@nestjs/common';
import { ExportService } from './export.service';
import  express  from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * 📦 Exporta un expediente completo en formato CTD (ZIP descargable)
   */
  @Get('ctd/:id')
  @Header('Content-Type', 'application/zip')
  async exportarCTD(@Param('id') id: string, @Res() res: express.Response) {
    const result = await this.exportService.exportarCTD(id) as { zipPath: string; message?: string };
    const { zipPath, message } = result;

    if (!fs.existsSync(zipPath)) {
      throw new NotFoundException('Archivo ZIP no encontrado.');
    }

    // Nombre del archivo (solo el nombre, no la ruta completa)
    const fileName = path.basename(zipPath);

    // Configura los headers HTTP para descarga
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/zip');

    // Stream del archivo ZIP
    const fileStream = fs.createReadStream(zipPath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('Error al enviar el ZIP:', err);
      res.status(500).json({ message: 'Error al enviar el archivo ZIP.' });
    });

    fileStream.on('close', () => {
      console.log(`✅ ZIP enviado correctamente: ${fileName}`);
    });
  }

  /**
   * 📄 Exporta un documento individual (Word, PDF, etc.)
   */
  @Get('documento/:id')
  async exportarDocumento(@Param('id') id: string, @Res() res: express.Response) {
    const documento = await this.exportService.exportarDocumento(id);

    if (!documento || !fs.existsSync(documento.ruta_archivo)) {
      throw new NotFoundException('Documento no encontrado.');
    }

    const fileName = path.basename(documento.ruta_archivo);

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );
    res.setHeader(
      'Content-Type',
      documento.mime_type || 'application/octet-stream',
    );

    const fileStream = fs.createReadStream(documento.ruta_archivo);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('Error al enviar documento:', err);
      res.status(500).json({ message: 'Error al enviar el documento.' });
    });

    fileStream.on('close', () => {
      console.log(`📄 Documento enviado correctamente: ${fileName}`);
    });
  }
}
