import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Documento,
  DocumentoTipo,
} from '../documentos/entities/documento.entity';
import { Plantilla } from '../plantillas/entities/plantilla.entity';
import { Modulo, ModuloEstado } from '../modulos/entities/modulo.entity';
import {
  Expediente,
  ExpedienteEstado,
} from '../expedientes/entities/expediente.entity';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { Multer } from 'multer';
import extract from 'extract-zip';

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

  // ✅ Función para limpiar nombres con tildes, eñes y caracteres inválidos
  private limpiarNombre(nombre: string): string {
    return nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ✅ Función para validar la entrada de importacion
  private validarEstructuraZip(
  basePath: string,
  tipo: 'documento' | 'modulo' | 'expediente',
) {
  const elementos = fs.readdirSync(basePath);
  const carpetas = elementos.filter((e) =>
    fs.lstatSync(path.join(basePath, e)).isDirectory(),
  );
  const archivos = elementos.filter((e) =>
    fs.lstatSync(path.join(basePath, e)).isFile(),
  );

  // 🔸 Validar estructura para Documento
  if (tipo === 'documento') {
    if (carpetas.length > 0) {
      throw new BadRequestException(
        'El ZIP de documento no debe contener carpetas, solo un archivo.',
      );
    }
    if (archivos.length !== 1) {
      throw new BadRequestException(
        'El ZIP de documento debe contener exactamente un archivo.',
      );
    }
  }

  // 🔸 Validar estructura para Módulo
  if (tipo === 'modulo') {
    if (carpetas.length !== 1) {
      throw new BadRequestException(
        'El ZIP de módulo debe contener exactamente una carpeta raíz.',
      );
    }

    const carpetaRaiz = path.join(basePath, carpetas[0]);
    const contenidoRaiz = fs.readdirSync(carpetaRaiz);

    const subcarpetasInternas = contenidoRaiz.filter((e) =>
      fs.lstatSync(path.join(carpetaRaiz, e)).isDirectory(),
    );

    if (subcarpetasInternas.length > 0) {
      throw new BadRequestException(
        'La carpeta del módulo no debe contener subcarpetas, solo documentos.',
      );
    }
  }

  // 🔸 Validar estructura para Expediente
  if (tipo === 'expediente') {
    if (carpetas.length === 0) {
      throw new BadRequestException(
        'El ZIP de expediente debe contener al menos una carpeta (módulo).',
      );
    }

    // Las carpetas pueden tener más subcarpetas, así que solo validamos que no esté vacío
    const totalArchivos = elementos.length;
    if (totalArchivos === 0) {
      throw new BadRequestException(
        'El ZIP de expediente no puede estar vacío.',
      );
    }
  }
}


  // ✅ Descomprime y detecta módulos y subcarpetas recursivamente
  async importarCTD(zipPath: string) {
    if (!fs.existsSync(zipPath)) {
      throw new BadRequestException('Archivo ZIP no encontrado');
    }

    const extractDir = path.join('uploads', `import_${Date.now()}`);
    fs.mkdirSync(extractDir, { recursive: true });

    await extract(zipPath, { dir: path.resolve(extractDir) });

    this.validarEstructuraZip(extractDir, 'expediente');

    const baseFolders = fs.readdirSync(extractDir);
    const carpetaRaiz = baseFolders.find((f) =>
      fs.lstatSync(path.join(extractDir, f)).isDirectory(),
    );
    const basePath = carpetaRaiz
      ? path.join(extractDir, carpetaRaiz)
      : extractDir;

    const expedienteNombre = this.limpiarNombre(path.basename(basePath));

    // 🗂 Crear expediente
    const expediente = await this.expedienteRepo.save({
      codigo: `EXP-${Date.now()}`,
      nombre: expedienteNombre,
      descripcion: `Expediente importado desde carpeta ${expedienteNombre}`,
      estado: ExpedienteEstado.BORRADOR,
    });

    // 🔁 Procesar carpetas recursivamente
    let moduloCounter = 1;
    const procesarCarpeta = async (folderPath: string, parentRuta: string,parentName = '') => {
      const carpetaNombre = this.limpiarNombre(path.basename(folderPath));
      const moduloRuta = path.join(parentRuta, carpetaNombre)
      const modulo = await this.moduloRepo.save({
        expediente,
        numero: moduloCounter++,
        titulo: parentName ? `${parentName} / ${carpetaNombre}` : carpetaNombre,
        descripcion: `Módulo importado desde ${folderPath}`,
        estado: ModuloEstado.BORRADOR,
         ruta: moduloRuta.replace(/\\/g, '/'),
      });

      const elementos = fs.readdirSync(folderPath);

      for (const elemento of elementos) {
        const elementoPath = path.join(folderPath, elemento);
        const stats = fs.lstatSync(elementoPath);

        if (stats.isDirectory()) {
          await procesarCarpeta(elementoPath,moduloRuta, carpetaNombre);
        } else if (stats.isFile()) {
          const ext = path.extname(elemento).toLowerCase();
          const nombreSinExt = path.basename(elemento, ext);

          // 📄 Word o Word+PDF asociados
          if (ext === '.docx' || ext === '.doc') {
            await this.documentoRepo.save({
              modulo,
              nombre: elemento,
              tipo: DocumentoTipo.PLANTILLA,
              version: 1,
              ruta_archivo: elementoPath,
              mime_type:
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });

            // Asociar PDF del mismo nombre como Plantilla también
            const pdfPath = path.join(folderPath, `${nombreSinExt}.pdf`);
            if (fs.existsSync(pdfPath)) {
              await this.documentoRepo.save({
                modulo,
                nombre: `${nombreSinExt}.pdf`,
                tipo: DocumentoTipo.PLANTILLA,
                version: 1,
                ruta_archivo: pdfPath,
                mime_type: 'application/pdf',
              });
            }
          } else if (ext === '.pdf') {
            await this.documentoRepo.save({
              modulo,
              nombre: elemento,
              tipo: DocumentoTipo.ANEXO,
              version: 1,
              ruta_archivo: elementoPath,
              mime_type: 'application/pdf',
            });
          } else {
            await this.documentoRepo.save({
              modulo,
              nombre: elemento,
              tipo: DocumentoTipo.OTRO,
              version: 1,
              ruta_archivo: elementoPath,
              mime_type: 'application/octet-stream',
            });
          }
        }
      }
    };

    await procesarCarpeta(basePath,expediente.codigo);

    return {
      message: `Expediente "${expediente.nombre}" importado correctamente con subcarpetas`,
      carpetaBase: basePath,
    };
  }

  async importarDocumento(file: Multer.File) {
  const uploadDir = path.join('uploads', 'documentos');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  // ❌ No se permiten ZIPs
  if (path.extname(file.originalname).toLowerCase() === '.zip') {
    throw new BadRequestException(
      'No se permite importar archivos ZIP en este endpoint. Solo documentos individuales.',
    );
  }

  // 🧠 Decodificar correctamente el nombre
  let decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');

  // 🧹 Limpiar caracteres peligrosos (pero mantener tildes y eñes)
  const safeName = decodedName
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 📁 Ruta destino sin prefijo
  const targetPath = path.join(uploadDir, safeName);

  // ⚠️ Evita sobrescribir un archivo existente
  if (fs.existsSync(targetPath)) {
    throw new BadRequestException(
      `Ya existe un archivo con el nombre "${safeName}" en el servidor.`,
    );
  }

  await promisify(fs.rename)(file.path, targetPath);

  return {
    filename: safeName,
    path: targetPath,
    mimetype: file.mimetype,
    message: 'Documento importado correctamente',
  };
}



  async importarModulo(file: Multer.File, expedienteId: string) {
    if (!expedienteId) {
      throw new BadRequestException(
        'Debe especificar el ID del expediente destino.',
      );
    }

    // 📁 Asegurar directorio temporal
    const uploadDir = path.join('uploads', 'modulos');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const targetPath = path.join(uploadDir, file.filename);
    await promisify(fs.rename)(file.path, targetPath);

    // 🔍 Obtener expediente destino
    const expediente = await this.expedienteRepo.findOne({
      where: { id: expedienteId },
    });
    if (!expediente) {
      throw new BadRequestException('Expediente destino no encontrado');
    }

    // 📦 Si es un ZIP, descomprimir
    let moduleBasePath = targetPath;
    if (path.extname(file.originalname).toLowerCase() === '.zip') {
      const extractDir = path.join(uploadDir, `mod_${Date.now()}`);
      fs.mkdirSync(extractDir, { recursive: true });
      await extract(targetPath, { dir: path.resolve(extractDir) });
      this.validarEstructuraZip(extractDir, 'modulo');

      // Tomar la primera carpeta dentro del zip como raíz del módulo
      const baseFolders = fs.readdirSync(extractDir);
      const carpetaRaiz = baseFolders.find((f) =>
        fs.lstatSync(path.join(extractDir, f)).isDirectory(),
      );
      moduleBasePath = carpetaRaiz
        ? path.join(extractDir, carpetaRaiz)
        : extractDir;
    }

    const moduloNombre = this.limpiarNombre(path.basename(moduleBasePath));
        const rutaModulo = `${expediente.codigo}/${moduloNombre}`;

    // 🧩 Crear módulo asociado al expediente
    const modulo = await this.moduloRepo.save({
      expediente,
      numero: (await this.moduloRepo.count({ where: { expediente } })) + 1,
      titulo: moduloNombre,
      descripcion: `Módulo importado desde ${file.originalname}`,
      estado: ModuloEstado.BORRADOR,
      ruta: rutaModulo,
    });

    // 🧾 Leer todos los archivos dentro del módulo
    const elementos = fs.readdirSync(moduleBasePath);
    for (const elemento of elementos) {
      const elementoPath = path.join(moduleBasePath, elemento);
      const stats = fs.lstatSync(elementoPath);
      if (!stats.isFile()) continue;

      const ext = path.extname(elemento).toLowerCase();
      const nombreSinExt = path.basename(elemento, ext);

      // 📄 Clasificar tipos de archivo
      if (ext === '.docx' || ext === '.doc') {
        await this.documentoRepo.save({
          modulo,
          nombre: elemento,
          tipo: DocumentoTipo.PLANTILLA,
          version: 1,
          ruta_archivo: elementoPath,
          mime_type:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        const pdfPath = path.join(moduleBasePath, `${nombreSinExt}.pdf`);
        if (fs.existsSync(pdfPath)) {
          await this.documentoRepo.save({
            modulo,
            nombre: `${nombreSinExt}.pdf`,
            tipo: DocumentoTipo.PLANTILLA,
            version: 1,
            ruta_archivo: pdfPath,
            mime_type: 'application/pdf',
          });
        }
      } else if (ext === '.pdf') {
        await this.documentoRepo.save({
          modulo,
          nombre: elemento,
          tipo: DocumentoTipo.ANEXO,
          version: 1,
          ruta_archivo: elementoPath,
          mime_type: 'application/pdf',
        });
      } else {
        await this.documentoRepo.save({
          modulo,
          nombre: elemento,
          tipo: DocumentoTipo.OTRO,
          version: 1,
          ruta_archivo: elementoPath,
          mime_type: 'application/octet-stream',
        });
      }
    }

    return {
      message: `Módulo "${modulo.titulo}" importado correctamente con ${elementos.length} documentos.`,
      moduloId: modulo.id,
      expedienteId: expediente.id,
      ruta: modulo.ruta,
    };
  }
}
