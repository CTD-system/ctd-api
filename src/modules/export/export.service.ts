import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expediente } from '../expedientes/entities/expediente.entity';
import { Documento } from '../documentos/entities/documento.entity';
import { Plantilla } from '../plantillas/entities/plantilla.entity';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { MinioService } from '../minio.service';
import express from 'express';
@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Expediente)
    private expedienteRepo: Repository<Expediente>,
    @InjectRepository(Documento)
    private documentoRepo: Repository<Documento>,
    @InjectRepository(Plantilla)
    private plantillaRepo: Repository<Plantilla>,
    private readonly minioService: MinioService,
  ) {}

  // 🔤 Limpia nombres (acentos, espacios y caracteres inválidos)
  private limpiarNombre(nombre: string): string {
    return nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // elimina tildes
      .replace(/[\\/:*?"<>|]/g, '') // elimina caracteres ilegales
      .replace(/\s+/g, ' ') // normaliza espacios
      .trim();
  }

  // 📦 Exportar un expediente completo con estructura real (basada en rutas)
  async exportarCTD(expedienteId: string) {
    const expediente = await this.expedienteRepo.findOne({
      where: { id: expedienteId },
      relations: ['modulos', 'modulos.documentos'],
    });

    if (!expediente) throw new NotFoundException('Expediente no encontrado');

    const expedienteNombre = this.limpiarNombre(
      expediente.nombre || expediente.codigo,
    );
    const baseDir = path.join('exports', `CTD_${expedienteNombre}`);
    fs.mkdirSync(baseDir, { recursive: true });

    // 🔁 Recorre los módulos y respeta la propiedad `ruta`
    for (const modulo of expediente.modulos) {
      const rutaModulo = modulo.ruta || modulo.titulo;
      const rutaJerarquica = rutaModulo
        .split('/')
        .map((p) => this.limpiarNombre(p.trim()));

      const moduloDir = path.join(baseDir, ...rutaJerarquica);
      fs.mkdirSync(moduloDir, { recursive: true });

      // 🧾 index.xml con metadatos del módulo
      const indexContent = `<modulo>
  <numero>${modulo.numero}</numero>
  <titulo>${modulo.titulo}</titulo>
  <descripcion>${modulo.descripcion ?? ''}</descripcion>
  <estado>${modulo.estado}</estado>
  <ruta>${modulo.ruta}</ruta>
</modulo>`;

      fs.writeFileSync(path.join(moduloDir, 'index.xml'), indexContent, 'utf8');

      // 📄 Copiar documentos (sin carpetas extra)
      for (const doc of modulo.documentos) {
        if (!doc.ruta_archivo || !fs.existsSync(doc.ruta_archivo)) continue;

        const fileName = this.limpiarNombre(path.basename(doc.ruta_archivo));
        const destino = path.join(moduloDir, fileName);

        fs.copyFileSync(doc.ruta_archivo, destino);
      }
    }

    // 🗜️ Generar el ZIP final
    const zipPath = path.join('exports', `CTD_${expedienteNombre}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () =>
        resolve({
          message: `Expediente "${expediente.nombre}" exportado correctamente con estructura basada en rutas.`,
          zipPath,
        }),
      );

      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(baseDir, false);
      archive.finalize();
    });
  }

  // 📄 Exportar un solo documento
  async exportarDocumento(id: string) {
    const documento = await this.documentoRepo.findOne({ where: { id } });
    if (!documento) throw new NotFoundException('Documento no encontrado');
    return documento;
  }

  async descargarExpedienteCompleto(
    expedienteId: string,
    res: express.Response,
  ) {
    if (!expedienteId) {
      throw new BadRequestException('Se requiere el ID del expediente.');
    }

    const tmpDir = path.join('downloads', 'expedientes', expedienteId);
    fs.mkdirSync(tmpDir, { recursive: true });

    try {
      const expediente = await this.expedienteRepo.findOne({
        where: { id: expedienteId },
      });

      if (!expediente) {
        throw new NotFoundException('Expediente no encontrado.');
      }

      const expedienteCodigo = expediente.codigo; // por ejemplo: "EXP-2025-001"
      const prefix = `expedientes/${expedienteCodigo}/`;
      // 🔍 Listar archivos del expediente
      const archivos = await this.minioService.listFilesByPrefix(
        'ctd-expedientes',
        prefix,
      );

      if (!archivos || archivos.length === 0) {
        throw new NotFoundException(
          'No se encontraron archivos para este expediente.',
        );
      }

      // 📥 Descargar todos los archivos localmente
      for (const file of archivos) {
        if (file.endsWith('/')) continue;

        const relativePath = file.substring(prefix.length);
        if (!relativePath || relativePath.startsWith('expedientes')) continue;
        const filePath = path.join(tmpDir, relativePath);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        await this.minioService.downloadFile('ctd-expedientes', file, filePath);
      }

      // 📦 Comprimir en ZIP
      const zipName = `expediente_${expediente.nombre}.zip`;
      const zipPath = path.join('downloads', zipName);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);
      archive.directory(tmpDir, expediente.nombre);
      await archive.finalize();

      // Esperar a que se complete el archivo ZIP
      await new Promise<void>((resolve, reject) => {
        output.on('close', () => resolve());
        output.on('error', (err) => reject(err));
      });

      // 📤 Enviar el ZIP al cliente
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

      const stream = fs.createReadStream(zipPath);
      stream.pipe(res);
    } catch (error) {
      console.error('❌ Error al generar ZIP:', error);
      throw new InternalServerErrorException(
        'Error al generar el ZIP del expediente.',
      );
    }
  }
}
