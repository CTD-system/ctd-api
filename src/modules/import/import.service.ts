import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documento } from '../documentos/entities/documento.entity';
import { Plantilla } from '../plantillas/entities/plantilla.entity';
import * as AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(Documento)
    private documentoRepo: Repository<Documento>,
    @InjectRepository(Plantilla)
    private plantillaRepo: Repository<Plantilla>,
  ) {}

  async importarCTD(zipPath: string) {
    if (!fs.existsSync(zipPath)) {
      throw new BadRequestException('Archivo ZIP no encontrado');
    }

    const extractDir = path.join('uploads', `import_${Date.now()}`);
    fs.mkdirSync(extractDir, { recursive: true });

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractDir, true);

    // Leer carpetas y registrar contenido
    const modulos = fs.readdirSync(extractDir);
    for (const modulo of modulos) {
      const moduloPath = path.join(extractDir, modulo);
      const anexosDir = path.join(moduloPath, 'anexos');
      if (fs.existsSync(anexosDir)) {
        const archivos = fs.readdirSync(anexosDir);
        for (const archivo of archivos) {
          const filePath = path.join(anexosDir, archivo);
          await this.documentoRepo.save({
            nombre: archivo,
            archivo: filePath,
          });
        }
      }
    }

    return { message: 'CTD importado correctamente', extractDir };
  }
}
