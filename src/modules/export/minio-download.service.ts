import { Injectable, NotFoundException } from '@nestjs/common';
import { MinioService } from '../minio.service';
import * as path from 'path';
import * as fs from 'fs';
import express from 'express';

@Injectable()
export class MinioDownloadService {
  constructor(private readonly minioService: MinioService) {}

  /**
   * Descarga un archivo desde MinIO y lo envía al cliente.
   */
  async descargarArchivo(bucket: string, filename: string, res: express.Response) {
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
