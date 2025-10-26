import {
  Controller,
  Get,
  Param,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { MinioDownloadService } from './minio-download.service';
import express from 'express';

@ApiTags('MinIO - Descarga directa')
@Controller('minio-download')
export class MinioDownloadController {
  constructor(
    private readonly minioDownloadService: MinioDownloadService,
    private readonly exportService: ExportService,
  ) {}

  @Get('expediente/:filename')
  @ApiOperation({
    summary: 'Descargar un expediente ZIP directamente desde MinIO',
  })
  @ApiParam({ name: 'filename', example: 'expediente_12345.zip' })
  @ApiResponse({
    status: 200,
    description: 'Archivo descargado correctamente.',
  })
  async descargarExpediente(
    @Param('filename') filename: string,
    @Res() res: express.Response,
  ) {
    if (!filename.endsWith('.zip')) {
      throw new BadRequestException(
        'Solo se pueden descargar archivos .zip en esta ruta.',
      );
    }
    return this.minioDownloadService.descargarArchivo(
      'ctd-imports',
      filename,
      res,
    );
  }

  @Get('modulo/:filename')
  @ApiOperation({ summary: 'Descargar un módulo ZIP directamente desde MinIO' })
  @ApiParam({ name: 'filename', example: 'modulo_1.zip' })
  async descargarModulo(
    @Param('filename') filename: string,
    @Res() res: express.Response,
  ) {
    if (!filename.endsWith('.zip')) {
      throw new BadRequestException(
        'Solo se pueden descargar archivos .zip en esta ruta.',
      );
    }
    return this.minioDownloadService.descargarArchivo(
      'ctd-imports',
      filename,
      res,
    );
  }

  @Get('documento/:filename')
  @ApiOperation({
    summary: 'Descargar un documento individual desde MinIO (no ZIP)',
  })
  @ApiParam({ name: 'filename', example: 'informe_final.docx' })
  async descargarDocumento(
    @Param('filename') filename: string,
    @Res() res: express.Response,
  ) {
    if (filename.endsWith('.zip')) {
      throw new BadRequestException(
        'Los documentos no pueden ser archivos ZIP.',
      );
    }
    return this.minioDownloadService.descargarArchivo(
      'ctd-imports',
      filename,
      res,
    );
  }

  @Get('expediente-zip/:expedienteId')
  @ApiOperation({
    summary:
      'Descargar todo un expediente (carpeta completa) como ZIP desde MinIO',
  })
  @ApiParam({
    name: 'expedienteId',
    example: 'c7971cae-9127-4ee1-99e6-8aec031a08d6',
  })
  async descargarExpedienteCompleto(
    @Param('expedienteId') expedienteId: string,
    @Res() res: express.Response,
  ) {
    return this.exportService.descargarExpedienteCompleto(expedienteId, res);
  }
}
