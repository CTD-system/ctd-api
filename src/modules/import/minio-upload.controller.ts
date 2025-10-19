import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { MinioService } from '../minio.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Multer } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Documento,
  DocumentoTipo,
} from '../documentos/entities/documento.entity';
import {
  Modulo,
  ModuloEstado,
} from '../modulos/entities/modulo.entity';
import {
  Expediente,
  ExpedienteEstado,
} from '../expedientes/entities/expediente.entity';

@ApiTags('MinIO - Subida a MinIO')
@Controller('minio-upload')
export class MinioUploadController {
  constructor(
    private readonly minioService: MinioService,
    @InjectRepository(Expediente)
    private readonly expedienteRepo: Repository<Expediente>,
    @InjectRepository(Modulo)
    private readonly moduloRepo: Repository<Modulo>,
    @InjectRepository(Documento)
    private readonly documentoRepo: Repository<Documento>,
  ) {}

  // 🔤 Limpia nombre (sin eliminar tildes)
  private limpiarNombre(nombre: string): string {
    return nombre.replace(/[\\/:*?"<>|]/g, '').trim();
  }

  // 📦 SUBIR EXPEDIENTE (.zip obligatorio)
  @Post('expediente')
  @ApiOperation({ summary: 'Subir un expediente ZIP a MinIO y registrarlo en BD' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Expediente subido y registrado correctamente.' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/expedientes',
        filename: (req, file, cb) => cb(null, file.originalname),
      }),
    }),
  )
  async uploadExpediente(@UploadedFile() file: Multer.File) {
    const bucket = 'ctd-imports';
    if (!file.originalname.endsWith('.zip')) {
      throw new BadRequestException('Solo se aceptan archivos .zip para expedientes.');
    }

    const expedienteNombre = this.limpiarNombre(path.basename(file.originalname, '.zip'));
    const filePath = path.resolve('uploads/expedientes', file.originalname);

    await this.minioService.uploadFile(bucket, file.originalname, filePath);

    // 🗂 Crear registro en la BD
    const expediente = this.expedienteRepo.create({
      codigo: `EXP-${Date.now()}`,
      nombre: expedienteNombre,
      descripcion: `Expediente cargado manualmente desde archivo ZIP (${file.originalname})`,
      estado: ExpedienteEstado.BORRADOR,
    });
    await this.expedienteRepo.save(expediente);

    return {
      message: 'Expediente subido y registrado correctamente.',
      bucket,
      fileName: file.originalname,
      expedienteId: expediente.id,
    };
  }

  // 📁 SUBIR MÓDULO (.zip obligatorio)
  @Post('modulo')
  @ApiOperation({ summary: 'Subir un módulo ZIP a MinIO y registrarlo en BD' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        expedienteId: { type: 'string', example: '1' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Módulo subido y registrado correctamente.' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/modulos',
        filename: (req, file, cb) => cb(null, file.originalname),
      }),
    }),
  )
  async uploadModulo(@UploadedFile() file: Multer.File) {
    const bucket = 'ctd-imports';
    if (!file.originalname.endsWith('.zip')) {
      throw new BadRequestException('Solo se aceptan archivos .zip para módulos.');
    }

    const moduloNombre = this.limpiarNombre(path.basename(file.originalname, '.zip'));
    const filePath = path.resolve('uploads/modulos', file.originalname);

    await this.minioService.uploadFile(bucket, file.originalname, filePath);

    // 🧩 Crear registro en la BD
    const modulo = this.moduloRepo.create({
      titulo: moduloNombre,
      descripcion: `Módulo cargado manualmente desde archivo ZIP (${file.originalname})`,
      estado: ModuloEstado.BORRADOR,
      numero: 1, // Podés asignar número dinámico según el expediente
    });
    await this.moduloRepo.save(modulo);

    return {
      message: 'Módulo subido y registrado correctamente.',
      bucket,
      fileName: file.originalname,
      moduloId: modulo.id,
    };
  }

  // 📄 SUBIR DOCUMENTO (no ZIP)
  @Post('documento')
@ApiOperation({
  summary:
    'Subir uno o varios documentos a MinIO, registrar en BD y vincular automáticamente anexos según nombre.',
})
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      files: {
        type: 'array',
        items: { type: 'string', format: 'binary' },
        description: 'Archivos a subir',
      },
      tipos: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['plantilla', 'anexo', 'informe', 'otro'],
        },
        description: 'Tipo de cada documento (mismo orden que los archivos)',
      },
    },
  },
})
@ApiResponse({
  status: 201,
  description:
    'Documentos subidos, registrados y vinculados correctamente si corresponde.',
})
@UseInterceptors(
  FilesInterceptor('files', 20, {
    storage: diskStorage({
      destination: 'uploads/documentos',
      filename: (req, file, cb) => cb(null, file.originalname),
    }),
  }),
)
async uploadDocumentos(
  @UploadedFiles() files: Multer.File[],
  @Body('tipos') tipos: string[] | string,
) {
  const bucket = 'ctd-imports';

  if (!files?.length) {
    throw new BadRequestException('Debe subir al menos un archivo.');
  }

  const tiposArray = Array.isArray(tipos) ? tipos : [tipos];
  if (tiposArray.length !== files.length) {
    throw new BadRequestException(
      `Debe especificar un tipo por cada archivo (${files.length} archivos, ${tiposArray.length} tipos recibidos).`,
    );
  }

  const guardados: (Documento & { nombreBase: string })[] = [];

  // 1️⃣ Subir cada archivo y registrar el documento
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const tipoInput = tiposArray[i]?.toLowerCase();

    if (path.extname(file.originalname).toLowerCase() === '.zip') {
      throw new BadRequestException(`No se permiten archivos .zip (${file.originalname}).`);
    }

    const filePath = path.resolve('uploads/documentos', file.originalname);
    const nombreLimpio = file.originalname.replace(/[\\/:*?"<>|]/g, '').trim();
    const nombreBase = path.parse(file.originalname).name.toLowerCase();

    await this.minioService.uploadFile(bucket, file.originalname, filePath);

    let tipoFinal: DocumentoTipo;
    switch (tipoInput) {
      case 'plantilla':
        tipoFinal = DocumentoTipo.PLANTILLA;
        break;
      case 'anexo':
        tipoFinal = DocumentoTipo.ANEXO;
        break;
      case 'informe':
        tipoFinal = DocumentoTipo.INFORME;
        break;
      default:
        tipoFinal = DocumentoTipo.OTRO;
    }

    const doc = this.documentoRepo.create({
      nombre: nombreLimpio,
      tipo: tipoFinal,
      version: 1,
      ruta_archivo: filePath,
      mime_type: file.mimetype,
    });

    const saved = await this.documentoRepo.save(doc);
    guardados.push({ ...saved, nombreBase });
  }

  // 2️⃣ Detectar y vincular anexos automáticamente
  for (const doc of guardados) {
    // Buscar documentos con el mismo nombre base
    const relacionados = guardados.filter(
      (d) =>
        d.nombre === doc.nombre &&
        d.id !== doc.id &&
        d.tipo !== DocumentoTipo.PLANTILLA,
    );

    if (relacionados.length > 0 ) {
      const documento = await this.documentoRepo.findOne({
        where: { id: doc.id },
        relations: ['anexos'],
      });
if(documento){
      documento.anexos = [...(documento.anexos || []), ...relacionados];
      await this.documentoRepo.save(documento);}
    }
  }

  return {
    message:
      'Documentos subidos, registrados y vinculados correctamente (si aplica).',
    bucket,
    resultados: guardados.map((g) => ({
      id: g.id,
      nombre: g.nombre,
      tipo: g.tipo,
      ruta: g.ruta_archivo,
    })),
  };
}

}
