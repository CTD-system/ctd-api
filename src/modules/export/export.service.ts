import {
  BadRequestException,
  HttpException,
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
import { Modulo } from '../modulos/entities/modulo.entity';
@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Expediente)
    private expedienteRepo: Repository<Expediente>,
    @InjectRepository(Documento)
    private documentoRepo: Repository<Documento>,
    @InjectRepository(Modulo)
    private moduloRepo: Repository<Modulo>,
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

    /**
   * Descargar 1 archivo (especial para imagenes) para edición de bloques
   */
  async descargarImagenIndividual(
    bucket: string,
    objectKey: string,
    res: express.Response
  ) {
    if (!objectKey) {
      throw new BadRequestException('Se requiere el objectKey.');
    }

    try {
      const stream = await this.minioService.getFileStream(bucket, objectKey);

      // si quieres que el navegador descargue / inline
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${path.basename(objectKey)}"`
      );

      stream.pipe(res);
    } catch (error) {
      console.error('❌ Error al descargar archivo:', error);
      throw new InternalServerErrorException(
        'Error al descargar archivo desde MinIO.'
      );
    }
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
  async exportarDocumento(documentoId: string, res: express.Response) {
  if (!documentoId) {
    throw new BadRequestException('Se requiere el ID del documento.');
  }

  const bucket = 'ctd-expedientes';
  const tmpDir = path.join('downloads', 'documentos', documentoId);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    // 1️⃣ Buscar documento en BD con sus relaciones
    const documento = await this.documentoRepo.findOne({
      where: { id: documentoId },
      relations: ['modulo', 'modulo.expediente'],
    });

    if (!documento) {
      throw new NotFoundException('Documento no encontrado.');
    }

    if (!documento.ruta_archivo) {
      throw new BadRequestException('El documento no tiene una ruta asociada en MinIO.');
    }

    const expediente = documento.modulo?.expediente;
    const safeDocName = this.limpiarNombre(documento.nombre || `documento_${documento.id}`);
    const safeExpName = expediente ? this.limpiarNombre(expediente.nombre) : 'sin_expediente';
    const safeModuloName = documento.modulo
      ? this.limpiarNombre(documento.modulo.titulo)
      : 'sin_modulo';

    // 2️⃣ Crear subcarpetas tipo: /downloads/documentos/<expediente>/<modulo>/
    const destinoDir = path.join(tmpDir, safeExpName, safeModuloName);
    fs.mkdirSync(destinoDir, { recursive: true });

    // 3️⃣ Descargar archivo desde MinIO
    const fileName = path.basename(documento.ruta_archivo);
    const destinoPath = path.join(destinoDir, fileName);
    await this.minioService.downloadFile(bucket, documento.ruta_archivo, destinoPath);

    // 4️⃣ Generar ZIP del documento
    const zipName = `${safeDocName}.zip`;
    const zipPath = path.join('downloads', zipName);

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(tmpDir, safeDocName);
    await archive.finalize();

    // Esperar a que termine el ZIP
    await new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      output.on('error', reject);
    });

    // 5️⃣ Enviar al cliente
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    const stream = fs.createReadStream(zipPath);
    stream.pipe(res);
  } catch (error) {
    console.error('❌ Error al exportar documento:', error);
    throw new InternalServerErrorException('Error al exportar el documento.');
  }
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

  // si es HttpException → la dejo pasar tal cual
  if (error instanceof HttpException) {
    throw error;
  }

  // todo lo no-controlado → si es interno: sí lo transformo a 500
  throw new InternalServerErrorException(
    'Error al generar el ZIP del expediente.',
  );
}
  }

  async descargarModuloCompleto(moduloId: string, res: express.Response) {
  if (!moduloId) {
    throw new BadRequestException('Se requiere el ID del módulo.');
  }

  const tmpDir = path.join('downloads', 'modulos', moduloId);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    const modulo = await this.moduloRepo.findOne({
      where: { id: moduloId },
      relations: ['documentos','expediente'],
    });

    if (!modulo) {
      throw new NotFoundException('Módulo no encontrado.');
    }

    if (!modulo.ruta) {
      throw new BadRequestException('El módulo no tiene una ruta asociada.');
    }

    const expediente = modulo.expediente;
    const bucket = 'ctd-expedientes';

    // Ejemplo: expedientes/EXP-2025-001/modulos/Modulo_A
    const prefix = modulo.ruta.endsWith('/')
      ? modulo.ruta
      : `${modulo.ruta}/`;

    // 🔍 Listar todos los objetos del módulo en MinIO
    const archivos = await this.minioService.listFilesByPrefix(bucket, prefix);

    if (!archivos || archivos.length === 0) {
      throw new NotFoundException(
        'No se encontraron archivos para este módulo en MinIO.',
      );
    }

    // 📥 Descargar todos los archivos localmente respetando estructura
    for (const file of archivos) {
      if (file.endsWith('/')) continue;

      const relativePath = file.substring(prefix.length);
      if (!relativePath) continue;

      const filePath = path.join(tmpDir, relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      await this.minioService.downloadFile(bucket, file, filePath);
    }

    // 📦 Comprimir el módulo en ZIP
    const safeModuloNombre = this.limpiarNombre(modulo.titulo || `modulo_${modulo.id}`);
    const zipName = `${safeModuloNombre}.zip`;
    const zipPath = path.join('downloads', zipName);

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(tmpDir, safeModuloNombre);
    await archive.finalize();

    // Esperar a que termine el ZIP
    await new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      output.on('error', reject);
    });

    // 📤 Enviar al cliente
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    const stream = fs.createReadStream(zipPath);
    stream.pipe(res);
  } catch (error) {
    console.error('❌ Error al generar ZIP del módulo:', error);
    throw new InternalServerErrorException('Error al generar el ZIP del módulo.');
  }
}

}
