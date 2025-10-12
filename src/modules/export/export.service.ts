import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expediente } from '../expedientes/entities/expediente.entity';
import { Documento } from '../documentos/entities/documento.entity';
import { Plantilla } from '../plantillas/entities/plantilla.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as AdmZip from 'adm-zip';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Expediente)
    private expedienteRepo: Repository<Expediente>,
    @InjectRepository(Documento)
    private documentoRepo: Repository<Documento>,
    @InjectRepository(Plantilla)
    private plantillaRepo: Repository<Plantilla>,
  ) {}

  async exportarCTD(expedienteId: string) {
    const expediente = await this.expedienteRepo.findOne({
  where: { id: expedienteId },
  relations: ['modulos', 'modulos.documentos'],
});

    if (!expediente) throw new NotFoundException('Expediente no encontrado');

    const baseDir = path.join('exports', `CTD_${expediente.id}`);
fs.mkdirSync(baseDir, { recursive: true });

    // Crear carpetas M1–M5 según módulos
    for (const modulo of expediente.modulos) {
  const mDir = path.join(baseDir, `m${modulo.numero}`);
  fs.mkdirSync(path.join(mDir, 'anexos'), { recursive: true });

      // Crear index.xml básico
      const indexContent = `<modulo>
    <numero>${modulo.numero}</numero>
    <titulo>${modulo.titulo}</titulo>
    <descripcion>${modulo.descripcion}</descripcion>
    <estado>${modulo.estado}</estado>
  </modulo>`;
  fs.writeFileSync(path.join(mDir, 'index.xml'), indexContent)

      // Copiar documentos de este módulo
      for (const doc of modulo.documentos) {
    const dest = path.join(mDir, 'anexos', path.basename(doc.ruta_archivo));
    if (fs.existsSync(doc.ruta_archivo)) fs.copyFileSync(doc.ruta_archivo, dest);
  }
}

    

    // Crear ZIP final
    const zip = new AdmZip();
    zip.addLocalFolder(baseDir);
    const zipPath = path.join('exports', `CTD_${expediente.codigo}.zip`);
    zip.writeZip(zipPath);

    return { message: 'CTD exportado correctamente', zipPath };
  }

  async exportarDocumento(id: string) {
    const documento = await this.documentoRepo.findOne({ where: { id } });

    if (!documento) {
      throw new NotFoundException('Documento no encontrado');
    }

    return documento;
  }
}

