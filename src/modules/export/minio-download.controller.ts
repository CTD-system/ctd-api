import {
  Controller,
  Get,
  Param,
  Res,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { MinioDownloadService } from './minio-download.service';
import express from 'express';
import { MinioService } from '../minio.service';

@ApiTags('MinIO - Descarga directa')
@Controller('minio-download')
export class MinioDownloadController {
  constructor(
    private readonly minioDownloadService: MinioDownloadService,
    private readonly exportService: ExportService,
    private readonly minioService : MinioService
  ) {}


  @Get('bloques/imagen')
async getImagen(
  @Query('key') key: string,
  @Res() res: express.Response
) {
  return this.exportService.descargarImagenIndividual(
    'ctd-imagenes',
    key,
    res
  );
}

@Get('bloques/imagen-url')
async getImagenUrl(@Query('key') key: string) {
  const bucket = 'ctd-imagenes';
  const url = await this.minioService.getPublicUrl(bucket, key);
  return { url };
}



  // 🧾 Exportar y descargar un documento individual como ZIP (descargado desde MinIO)
  @Get('documento-zip/:documentoId')
  @ApiOperation({
    summary:
      'Descargar un documento individual (extraído desde MinIO) como ZIP con estructura',
  })
  @ApiParam({
    name: 'documentoId',
    example: 'b1d0c3a2-5ef7-4f7e-a1bb-53b99b3d2df1',
  })
  @ApiResponse({
    status: 200,
    description: 'Documento descargado correctamente como ZIP.',
  })
  async descargarDocumentoCompleto(
    @Param('documentoId') documentoId: string,
    @Res() res: express.Response,
  ) {
    return this.exportService.exportarDocumento(documentoId, res);
  }

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

  @Get('modulo-zip/:moduloId')
  @ApiOperation({
    summary:
      'Descargar todo un módulo (con estructura y documentos) como ZIP desde MinIO',
  })
  @ApiParam({
    name: 'moduloId',
    example: 'a6d86b3c-20fd-4b7a-b91e-3e0847c0e1b1',
  })
  async descargarModuloCompleto(
    @Param('moduloId') moduloId: string,
    @Res() res: express.Response,
  ) {
    return this.exportService.descargarModuloCompleto(moduloId, res);
  }

  

  
}
