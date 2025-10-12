import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documento, DocumentoTipo } from '../documentos/entities/documento.entity';
import { Plantilla } from '../plantillas/entities/plantilla.entity';
import { Modulo, ModuloEstado } from '../modulos/entities/modulo.entity';
import { Expediente, ExpedienteEstado } from '../expedientes/entities/expediente.entity';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { Multer } from 'multer';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(Documento)
    private documentoRepo: Repository<Documento>,
    @InjectRepository(Plantilla)
    private plantillaRepo: Repository<Plantilla>,
    @InjectRepository(Modulo)
    private moduloRepo: Repository<Modulo>,
    @InjectRepository(Expediente)
    private expedienteRepo: Repository<Expediente>,
  ) {}

  // Importa ZIP como expediente con módulos y documentos + PDFs asociados
  async importarCTD(zipPath: string) {
    if (!fs.existsSync(zipPath)) {
      throw new BadRequestException('Archivo ZIP no encontrado');
    }

    const extractDir = path.join('uploads', `import_${Date.now()}`);
    fs.mkdirSync(extractDir, { recursive: true });
    const AdmZip = require('adm-zip');

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractDir, true);

    // Crear expediente
    const expediente = await this.expedienteRepo.save({
      codigo: `EXP-${Date.now()}`,
      nombre: 'Expediente importado',
      descripcion: 'Importado desde ZIP',
      estado: ExpedienteEstado.BORRADOR,
    });

    const carpetas = fs.readdirSync(extractDir);
    let moduloNumero = 1;

    for (const carpeta of carpetas) {
      const moduloPath = path.join(extractDir, carpeta);
      if (!fs.lstatSync(moduloPath).isDirectory()) continue;

      // Crear módulo
      const modulo = await this.moduloRepo.save({
        expediente,
        numero: moduloNumero++,
        titulo: carpeta,
        descripcion: `Módulo importado: ${carpeta}`,
        estado: ModuloEstado.BORRADOR,
      });

      const archivos = fs.readdirSync(moduloPath);
      const procesados: Set<string> = new Set();

      for (const archivo of archivos) {
        const filePath = path.join(moduloPath, archivo);
        if (!fs.lstatSync(filePath).isFile()) continue;

        const ext = path.extname(archivo).toLowerCase();
        const nombreSinExt = path.basename(archivo, ext);

        // Si es Word (.docx/.doc) crear plantilla
        if (ext === '.docx' || ext === '.doc') {
          const documento = await this.documentoRepo.save({
            modulo,
            nombre: archivo,
            tipo: DocumentoTipo.PLANTILLA,
            version: 1,
            ruta_archivo: filePath,
            mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          });
          procesados.add(nombreSinExt);

          // Buscar PDF con mismo nombre
          const pdfName = `${nombreSinExt}.pdf`;
          const pdfPath = path.join(moduloPath, pdfName);
          if (fs.existsSync(pdfPath)) {
            await this.documentoRepo.save({
              modulo,
              nombre: pdfName,
              tipo: DocumentoTipo.ANEXO,
              version: 1,
              ruta_archivo: pdfPath,
              mime_type: 'application/pdf',
            });
            procesados.add(nombreSinExt);
          }
        }
        // Archivos que no son Word ni PDF y no se han procesado se guardan como "otro"
        else if (ext === '.pdf' && !procesados.has(nombreSinExt)) {
          await this.documentoRepo.save({
            modulo,
            nombre: archivo,
            tipo: DocumentoTipo.ANEXO,
            version: 1,
            ruta_archivo: filePath,
            mime_type: 'application/pdf',
          });
        } else if (!procesados.has(nombreSinExt)) {
          await this.documentoRepo.save({
            modulo,
            nombre: archivo,
            tipo: DocumentoTipo.OTRO,
            version: 1,
            ruta_archivo: filePath,
            mime_type: 'application/octet-stream',
          });
        }
      }
    }

    return { message: 'CTD importado correctamente', expedienteId: expediente.id };
  }

  // Subida de documento individual
  async importarDocumento(file: Multer.File) {
    const uploadDir = path.join('uploads', 'documentos');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const targetPath = path.join(uploadDir, file.filename);
    await promisify(fs.rename)(file.path, targetPath);

    return {
      filename: file.filename,
      path: targetPath,
      mimetype: file.mimetype,
      message: 'Documento subido correctamente',
    };
  }
}
