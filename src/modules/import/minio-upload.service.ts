import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { Repository } from 'typeorm';
import { MinioService } from '../minio.service';
import {
  Expediente,
  ExpedienteEstado,
} from '../expedientes/entities/expediente.entity';
import { Modulo, ModuloEstado } from '../modulos/entities/modulo.entity';
import {
  Documento,
  DocumentoTipo,
} from '../documentos/entities/documento.entity';
import { Multer } from 'multer';
import { Plantilla } from '../plantillas/entities/plantilla.entity';
import { User } from '../users/entities/user.entity';
import * as JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';
import * as mammoth from 'mammoth';
import * as iconv from 'iconv-lite';
import { JSDOM } from 'jsdom'
import extract from 'extract-zip';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class MinioUploadService {
  constructor(
    private readonly minioService: MinioService,
    @InjectRepository(Expediente)
    private readonly expedienteRepo: Repository<Expediente>,
    @InjectRepository(Modulo)
    private readonly moduloRepo: Repository<Modulo>,
    @InjectRepository(Documento)
    private readonly documentoRepo: Repository<Documento>,
    @InjectRepository(Plantilla)
    private readonly plantillaRepo: Repository<Plantilla>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    
  }

  // 🔤 Limpia el nombre de archivo
  private limpiarNombre(nombre: string): string {
    // 1️⃣ Decodificar correctamente a UTF-8
    let decoded = iconv.decode(Buffer.from(nombre, 'binary'), 'utf-8');

    // 2️⃣ Eliminar la extensión

    // 3️⃣ Eliminar números al inicio seguidos de guion o underscore
    const sinNumeros = decoded.replace(/^\d+[_-]?/, '');

    // 4️⃣ Eliminar caracteres inválidos para archivos
    const caracteresValidos = sinNumeros.replace(/[\\/:*?"<>|]/g, '');

    // 5️⃣ Normalizar acentos y caracteres especiales
    const normalizado = caracteresValidos.normalize('NFC');

    // 6️⃣ Reemplazar múltiples espacios por uno solo y hacer trim
    return normalizado.replace(/\s+/g, ' ').trim();
  }

  // 📦 Subida de expediente ZIP
  // async uploadExpediente(file: Multer.File) {
  //   const bucket = 'ctd-imports';
  //   if (!file.originalname.endsWith('.zip')) {
  //     throw new BadRequestException(
  //       'Solo se aceptan archivos .zip para expedientes.',
  //     );
  //   }

  //   const expedienteNombre = this.limpiarNombre(
  //     path.basename(file.originalname, '.zip'),
  //   );
  //   const filePath = path.resolve('uploads/expedientes', file.originalname);

  //   await this.minioService.uploadFile(bucket, file.originalname, filePath);

  //   const expediente = this.expedienteRepo.create({
  //     codigo: `EXP-${Date.now()}`,
  //     nombre: file.originalname,
  //     descripcion: `Expediente cargado manualmente desde archivo ZIP (${file.originalname})`,
  //     estado: ExpedienteEstado.BORRADOR,
  //   });
  //   await this.expedienteRepo.save(expediente);

  //   return {
  //     message: 'Expediente subido y registrado correctamente.',
  //     bucket,
  //     fileName: file.originalname,
  //     expedienteId: expediente.id,
  //   };
  // }

  // 📁 Subida de módulo ZIP
  async uploadModulo(file: Multer.File, expedienteId: string) {
  if (!expedienteId) {
    throw new BadRequestException('Debe proporcionarse un expediente para guardar el módulo.');
  }

  // Buscar el expediente en BD para obtener la ruta en MinIO
  const expediente = await this.expedienteRepo.findOne({ where: { id: expedienteId } });
  if (!expediente) {
    throw new BadRequestException('Expediente no encontrado.');
  }

  const bucket = 'ctd-expedientes'; // usamos mismo bucket de expedientes
  const expedienteBaseKey = `expedientes/${expediente.nombre}` || `expedientes/${expediente.id}`; // ruta base en MinIO

  if (!file.originalname.endsWith('.zip')) {
    throw new BadRequestException('Solo se aceptan archivos .zip para módulos.');
  }

  const moduloNombre = this.limpiarNombre(path.basename(file.originalname, '.zip'));
  const tmpDir = path.join(os.tmpdir(), `ctd_mod_${Date.now()}_${uuidv4()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  const zipPath = file.path

  // Extraer ZIP
  await extract(zipPath, { dir: tmpDir });

  // Validar estructura módulo
  this.validarEstructuraZip(tmpDir, 'modulo');

  // Carpeta raíz del módulo
  const baseFolders = fs.readdirSync(tmpDir);
  const carpetaRaiz = baseFolders.find((f) =>
    fs.lstatSync(path.join(tmpDir, f)).isDirectory()
  );
  const basePath = carpetaRaiz ? path.join(tmpDir, carpetaRaiz) : tmpDir;

  // Crear módulo en BD asociado al expediente
  const moduloRuta = `${expedienteBaseKey}/modulos/${moduloNombre}`;
  const modulo = this.moduloRepo.create({
    titulo: moduloNombre,
    descripcion: `Módulo importado desde ${file.originalname}`,
    estado: ModuloEstado.BORRADOR,
    ruta: moduloRuta,
    expediente: expediente,
  });
  const savedModulo = await this.moduloRepo.save(modulo);

  // Crear carpeta raíz en MinIO
  await this.minioService.createFolder(bucket, moduloRuta);

  // Subir archivos del módulo recursivamente
  const subirCarpeta = async (folderPath: string, rutaDestino: string) => {
    const elementos = fs.readdirSync(folderPath);
    for (const elemento of elementos) {
      const elementoPath = path.join(folderPath, elemento);
      const stats = fs.lstatSync(elementoPath);

      if (stats.isFile()) {
        const ext = path.extname(elemento).toLowerCase();
        const nombreSinExt = path.basename(elemento, ext);
        const objectKey = `${rutaDestino}/${elemento}`;
        await this.minioService.uploadFile(bucket, objectKey, elementoPath);

        let tipoDoc = DocumentoTipo.OTRO;
        let mime = 'application/octet-stream';
        if (ext === '.docx' || ext === '.doc') {
          tipoDoc = DocumentoTipo.INFORME;
          mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (ext === '.pdf') {
          tipoDoc = DocumentoTipo.ANEXO;
          mime = 'application/pdf';
        }

        await this.documentoRepo.save({
          modulo: savedModulo,
          nombre: elemento,
          tipo: tipoDoc,
          version: 1,
          ruta_archivo: objectKey,
          mime_type: mime,
        });

        // Extraer configuración si es plantilla Word
        
      }  if (stats.isDirectory()) {
        await subirCarpeta(elementoPath, `${rutaDestino}/${elemento}`);
      }
    }
  };

  await subirCarpeta(basePath, moduloRuta);

  // Limpiar temporal
  fs.rmSync(tmpDir, { recursive: true, force: true });

  return {
    message: `Módulo "${moduloNombre}" importado correctamente dentro del expediente "${expediente.nombre}"`,
    moduloId: savedModulo.id,
    bucket,
    baseKey: moduloRuta,
  };
}



  // 📄 Subida de documentos (no ZIP)
  async uploadDocumentos(
  files: Multer.File[],
  tipos: string[] | string,
  moduloId: string,
  creado_por?: string,
) {
  if (!files?.length) {
    throw new BadRequestException('Debe subir al menos un archivo.');
  }

  // Verificar módulo
  const modulo = await this.moduloRepo.findOne({
    where: { id: moduloId },
    relations: ['expediente'],
  });
  if (!modulo) {
    throw new BadRequestException('El módulo especificado no existe.');
  }

  const expediente = modulo.expediente;
  if (!expediente) {
    throw new BadRequestException('El módulo no está asociado a ningún expediente.');
  }

  const bucket = 'ctd-expedientes';
  const tiposArray = Array.isArray(tipos) ? tipos : [tipos];

  if (tiposArray.length !== files.length) {
    throw new BadRequestException(
      `Debe especificar un tipo por cada archivo (${files.length} archivos, ${tiposArray.length} tipos recibidos).`,
    );
  }

  const guardados: (Documento & { nombreBase: string })[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const tipoInput = tiposArray[i]?.toLowerCase();

    if (path.extname(file.originalname).toLowerCase() === '.zip') {
      throw new BadRequestException(`No se permiten archivos .zip (${file.originalname}).`);
    }

    const nombreLimpio = this.limpiarNombre(file.originalname);
    const nombreBase = path.parse(file.originalname).name.toLowerCase();

    // Determinar tipo de documento
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

    // 🔹 Nueva lógica de ruta: si es ANEXO → dentro de /ANEXOS/{modulo}
    const baseRuta =
      tipoFinal === DocumentoTipo.ANEXO
        ? `expedientes/${expediente.nombre}/ANEXOS/${modulo.titulo}`
        : `expedientes/${expediente.nombre}/modulos/${modulo.titulo}`;

    await this.minioService.createFolder(bucket, baseRuta);

    const objectKey = `${baseRuta}/${file.originalname}`;
    await this.minioService.uploadFile(bucket, objectKey, file.path);

    // Crear documento vinculado al módulo
    const doc = this.documentoRepo.create({
      modulo,
      nombre: nombreLimpio,
      tipo: tipoFinal,
      version: 1,
      ruta_archivo: objectKey,
      mime_type: file.mimetype,
    });
    const savedDoc = await this.documentoRepo.save(doc);
    guardados.push({ ...savedDoc, nombreBase });

    // Si es plantilla Word, procesar configuración
    if (
      tipoFinal === DocumentoTipo.PLANTILLA &&
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      try {
        const config = await this.extraerConfiguracionPlantillaWord(file.path);
        const plantilla = this.plantillaRepo.create({
          nombre: `Plantilla_${nombreLimpio}`,
          descripcion: `Plantilla creada desde ${file.originalname}`,
          tipo_archivo: file.mimetype,
          creado_por: creado_por ? ({ id: creado_por } as any) : undefined,
          ...config,
        });
        await this.plantillaRepo.save(plantilla);
      } catch (err) {
        console.warn(`Error procesando plantilla ${file.originalname}:`, err.message);
      }
    }
  }

  return {
    message: `Se subieron ${guardados.length} documentos al módulo "${modulo.titulo}" del expediente "${expediente.nombre}".`,
    moduloId: modulo.id,
    bucket,
    resultados: guardados.map((g) => ({
      id: g.id,
      nombre: g.nombre,
      tipo: g.tipo,
      ruta: g.ruta_archivo,
    })),
  };
}



  /**
   * 🧠 Extrae configuración de Word (.docx) para una plantilla
   */

   async extraerConfiguracionPlantillaWord(
  filePath: string,
): Promise<Partial<Plantilla>> {
  try {
    const buffer = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(buffer);
    const config: Partial<Plantilla> = {};


    /** --- 📄 HEADER / FOOTER --- **/
    config.encabezado = await zip.file('word/header1.xml')?.async('text') ;
    config.pie_pagina = await zip.file('word/footer1.xml')?.async('text') ;

    /** --- 🎨 ESTILOS --- **/
    const stylesFile = zip.file('word/styles.xml');
    if (stylesFile) {
      const xml = await stylesFile.async('text');
      const json = await parseStringPromise(xml);
      const estilos = json['w:styles']?.['w:style'] || [];
      config.estilos_detectados = {
        nombres_estilos: estilos.map((s: any) => s['$']?.['w:styleId']).filter(Boolean),
        estilos_personalizados: estilos
          .filter((s: any) => s['$']?.['w:customStyle'] === '1')
          .map((s: any) => ({
            nombre: s['w:name']?.[0]?.['$']?.['w:val'],
            fuente: s['w:rPr']?.[0]?.['w:rFonts']?.[0]?.['$']?.['w:ascii'],
            tamano_fuente:
              parseFloat(s['w:rPr']?.[0]?.['w:sz']?.[0]?.['$']?.['w:val']) / 2,
            color: s['w:rPr']?.[0]?.['w:color']?.[0]?.['$']?.['w:val'],
            negrita: !!s['w:rPr']?.[0]?.['w:b'],
            cursiva: !!s['w:rPr']?.[0]?.['w:i'],
          })),
      };
    }

    /** --- 🧩 ESTRUCTURA SEMÁNTICA --- **/
    const result = await mammoth.convertToHtml({ path: filePath });
    const html = result.value;

    const estructura = this.procesarEstructuraHTML(html);
    config.estructura = estructura;
    config.autogenerar_indice = estructura.bloques.some(
      (b) => b.tipo === 'capitulo' || b.tipo === 'subcapitulo',
    );

    config.titulo =
      estructura.titulo ||
      path.basename(filePath, path.extname(filePath));

    return config;
  } catch (error) {
    console.error('Error al procesar plantilla:', error);
    throw new Error(`No se pudo procesar la plantilla: ${error.message}`);
  }
}

/** --- 🧠 NUEVO PARSER HTML → ESTRUCTURA JSON --- **/


 

private procesarEstructuraHTML(html: string): {
  tipo: 'documento';
  titulo?: string;
  bloques: any[];
} {
  const dom = new JSDOM(html);
  const body = dom.window.document.body;

  const bloques = this.parsearNodos(body.children);
  return { tipo: 'documento', bloques };
}

/** --- 🔍 Procesa cualquier lista de nodos del DOM --- **/
private parsearNodos(nodos: HTMLCollection): any[] {
  const bloques: any[] = [];
  let currentCapitulo: any = null;
  let currentSubCapitulo: any = null;

  for (const node of Array.from(nodos)) {
    const tag = node.tagName?.toLowerCase();

    switch (tag) {
      case 'h1':
        currentCapitulo = { tipo: 'capitulo', titulo: node.textContent?.trim(), bloques: [] };
        bloques.push(currentCapitulo);
        currentSubCapitulo = null;
        break;

      case 'h2':
        if (!currentCapitulo) {
          currentCapitulo = { tipo: 'capitulo', titulo: 'General', bloques: [] };
          bloques.push(currentCapitulo);
        }
        currentSubCapitulo = { tipo: 'subcapitulo', titulo: node.textContent?.trim(), bloques: [] };
        currentCapitulo.bloques.push(currentSubCapitulo);
        break;

      case 'p':
        const parrafo = this.parsearParrafo(node);
        this.agregarABloqueActual(parrafo, bloques, currentCapitulo, currentSubCapitulo);
        break;

      case 'table':
        const tabla = this.extraerTabla(node.outerHTML);
        this.agregarABloqueActual(tabla, bloques, currentCapitulo, currentSubCapitulo);
        break;

      case 'ul':
      case 'ol':
        const lista = this.parsearLista(node);
        this.agregarABloqueActual(lista, bloques, currentCapitulo, currentSubCapitulo);
        break;

      case 'img':
        const img = {
          tipo: 'imagen',
          src: node.getAttribute('src'),
          alt: node.getAttribute('alt') || '',
        };
        this.agregarABloqueActual(img, bloques, currentCapitulo, currentSubCapitulo);
        break;

      default:
        // Si hay nodos inesperados, procesar sus hijos recursivamente
        if (node.children?.length > 0) {
          const sub = this.parsearNodos(node.children);
          sub.forEach((b) =>
            this.agregarABloqueActual(b, bloques, currentCapitulo, currentSubCapitulo),
          );
        }
        break;
    }
  }

  return bloques;
}

/** --- 🧱 Añade un bloque al contexto correcto --- **/
private agregarABloqueActual(
  bloque: any,
  bloques: any[],
  cap?: any,
  sub?: any,
) {
  if (sub) sub.bloques.push(bloque);
  else if (cap) cap.bloques.push(bloque);
  else bloques.push(bloque);
}

/** --- 📝 Procesar párrafos con negrita, enlaces, placeholders --- **/
private parsearParrafo(node: Element) {
  const html = node.innerHTML.trim();

  // Extraer placeholders como {{variable}}
  const placeholders = [...html.matchAll(/{{(.*?)}}/g)].map((m) => m[1].trim());

  return {
    tipo: 'parrafo',
    texto_html: html, // Conservamos el HTML limpio
    texto_plano: node.textContent?.trim() || '',
    placeholders: placeholders.length > 0 ? placeholders : undefined,
  };
}

/** --- 📋 Procesar listas ul/ol --- **/
private parsearLista(node: Element) {
  const tipo = node.tagName.toLowerCase() === 'ul' ? 'lista_ul' : 'lista_ol';
  const items = Array.from(node.querySelectorAll(':scope > li')).map((li) => ({
    texto_html: li.innerHTML.trim(),
    texto_plano: li.textContent?.trim(),
  }));

  // ✅ Si es <ol> con un solo item → convertirlo a título/sección
  if (tipo === 'lista_ol' && items.length === 1) {
    return { tipo: 'capitulo', titulo: items[0].texto_plano, bloques: [] };
  }

  return { tipo, items };
}



/** --- 🧮 Extraer tabla del HTML --- **/
private extraerTabla(htmlTable: string) {
  const dom = new JSDOM(htmlTable);
  const table = dom.window.document.querySelector('table')
              || dom.window.document.body.querySelector('tr')?.closest('table');

  if (!table) return { tipo: 'tabla', encabezados: [], filas: [] };

  const rows: any[] = Array.from(table.querySelectorAll('tr'));
const filasAnidadas: Set<string> = new Set();
  const data = rows.map((tr: any) => {
    return Array.from(tr.querySelectorAll('th, td')).map((td: any) => {
      // Comprobamos si hay una tabla anidada dentro de la celda.
      const innerTable = td.querySelector('table');
      if (innerTable) {
         const innerRows = Array.from(innerTable.querySelectorAll('tr'));
        // Si encontramos una tabla interna, extraemos su texto y almacenamos las filas
        innerRows.forEach((row: any) => {
          Array.from(row.querySelectorAll('th, td')).forEach((cell: any) => {
            const text = cell.textContent?.replace(/\s+/g, ' ').trim() || '';
            if (text) filasAnidadas.add(text);
          });
        });
       
        
        // Aquí extraemos la tabla anidada y la tratamos como parte de la celda.
        return {
          tipo: 'tabla_anidada',
          tabla: this.extraerTabla(innerTable.outerHTML), // Extraemos la tabla anidada recursivamente.
          element: td,
          colSpan: td.colSpan || 1,
          rowSpan: td.rowSpan || 1
        };
      } else {
        const text = td.textContent?.replace(/\s+/g, ' ').trim() || '';
        return {
          text,
          element: td,
          colSpan: td.colSpan || 1,
          rowSpan: td.rowSpan || 1
        };
      }
    });
  });

  let encabezados: any[] = [];
  let filas: any[][] = [];

  const thead = table.querySelector('thead');
  if (thead) {
    // Encabezados desde <thead>
    encabezados = Array.from(thead.querySelectorAll('th')).map((th: any) => ({
      text: th.textContent?.trim() || '',
      element: th,
      colSpan: th.colSpan || 1,
      rowSpan: th.rowSpan || 1
    }));
    filas = data.slice(thead.querySelectorAll('tr').length);
  } else if (rows[0]?.querySelector('th')) {
    // Primera fila con <th> como encabezado
    encabezados = data[0];
    filas = data.slice(1);
  } else {
    // No hay encabezados
    filas = data;
  }

  // Filtrar las celdas de la fila que contiene la tabla anidada (sin eliminar toda la fila)
  filas = filas.map((fila, index) => {
    const filaConTablaAnidada = fila.some(celda => celda.tipo === 'tabla_anidada');
    
    // Si la fila contiene una tabla anidada, filtramos solo las celdas que coincidan con el texto de la tabla anidada
    if (filaConTablaAnidada) {
      return fila.filter(celda => {
        // Excluimos la celda si su texto está en la tabla anidada
        return !filasAnidadas.has(celda.text);
      });
    }

    // Para las demás filas (sin tabla anidada), filtramos también las celdas
    return fila.filter(celda => {
      // Excluimos la celda si su texto está en la tabla anidada
      return !filasAnidadas.has(celda.text);
    });
  });

  // Eliminamos las filas que quedan vacías después del filtrado de celdas
  filas = filas.filter(fila => fila.length > 0);
  console.log(filas);
   
  return { tipo: 'tabla', encabezados, filas };
}

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

async importarCTD(zipPath: string) {
  if (!fs.existsSync(zipPath)) {
    throw new BadRequestException('Archivo ZIP no encontrado');
  }

  // Crear carpeta temporal única
  const tmpDir = path.join(os.tmpdir(), `ctd_import_${Date.now()}_${uuidv4()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    // Extraer ZIP a temporal
    await extract(zipPath, { dir: path.resolve(tmpDir) });

    // Validar estructura (lanza si no es correcta)
    this.validarEstructuraZip(tmpDir, 'expediente');

    // Buscar la carpeta raíz si existe
    const baseFolders = fs.readdirSync(tmpDir);
    const carpetaRaiz = baseFolders.find((f) =>
      fs.lstatSync(path.join(tmpDir, f)).isDirectory(),
    );
    const basePath = carpetaRaiz ? path.join(tmpDir, carpetaRaiz) : tmpDir;

    // Nombre limpio y creación del expediente en BD
    const expedienteNombre = this.limpiarNombre(path.basename(basePath));
    const codigoExpediente = `EXP-${Date.now()}`;

    let user: User | null = null; // si necesitas asignar creado_por, búscalo previamente

    const expediente = this.expedienteRepo.create({
      codigo: codigoExpediente,
      nombre: expedienteNombre,
      descripcion: `Expediente importado desde carpeta ${expedienteNombre}`,
      estado: ExpedienteEstado.BORRADOR,
      creado_por: user || undefined,
    });
    const savedExpediente = await this.expedienteRepo.save(expediente);

    // Crear carpeta raíz en MinIO: expedientes/{codigo}
    const bucket = 'ctd-expedientes';
    const expedienteBaseKey = `expedientes/${expedienteNombre}`;
    await this.minioService.createFolder(bucket, expedienteBaseKey);

    // Contador de módulos para numeración
    let moduloCounter = 1;

    // Helper: subir un archivo local a MinIO y devolver objectName
    const uploadFileToMinio = async (localPath: string, objectKey: string) => {
      // objectKey es la ruta dentro del bucket, p. ej. expedientes/EXP-.../mod1/doc.pdf
      await this.minioService.uploadFile(bucket, objectKey, localPath);
      return objectKey;
    };

    // Procesar carpetas recursivamente creando módulos y documentos,
    // y subiendo cada archivo a MinIO sin dejar copia local permanente.
    const procesarCarpeta = async (folderPath: string, parentRuta: string, parentName = '') => {
      const carpetaNombre = this.limpiarNombre(path.basename(folderPath));
      const moduloRuta = path.posix.join(parentRuta, carpetaNombre).replace(/\\/g, '/'); // ruta lógica
      const tituloModulo = parentName ? `${parentName} / ${carpetaNombre}` : carpetaNombre;

      const modulo = this.moduloRepo.create({
        expediente: savedExpediente,
        titulo: tituloModulo,
        descripcion: `Módulo importado desde ${carpetaNombre}`,
        estado: ModuloEstado.BORRADOR,
        ruta: moduloRuta,
      });
      const savedModulo = await this.moduloRepo.save(modulo);

      const elementos = fs.readdirSync(folderPath);
      for (const elemento of elementos) {
        const elementoPath = path.join(folderPath, elemento);
        const stats = fs.lstatSync(elementoPath);

        if (stats.isDirectory()) {
          // Recursión: subcarpeta → submódulo
          await procesarCarpeta(elementoPath, moduloRuta, carpetaNombre);
        } else if (stats.isFile()) {
          const ext = path.extname(elemento).toLowerCase();
          const nombreSinExt = path.basename(elemento, ext);
          // Construir objectKey en MinIO: expedientes/{codigo}/{ruta_relativa_al_base}
          const relativePath = path.relative(basePath, elementoPath).split(path.sep).join('/');
          const objectKey = `${expedienteBaseKey}/${relativePath}`;

          // Subir a MinIO
          await uploadFileToMinio(elementoPath, objectKey);

          // Determinar tipo de documento
          let tipoDoc = DocumentoTipo.OTRO;
          let mime = 'application/octet-stream';
          if (ext === '.docx' || ext === '.doc') {
            tipoDoc = DocumentoTipo.INFORME;
            mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          } else if (ext === '.pdf') {
            tipoDoc = DocumentoTipo.ANEXO;
            mime = 'application/pdf';
          }

          // Guardar registro Documento en BD; ruta_archivo apunta al objectKey en MinIO
          await this.documentoRepo.save({
            modulo: savedModulo,
            nombre: elemento,
            tipo: tipoDoc,
            version: 1,
            ruta_archivo: objectKey, // guardamos la key dentro del bucket
            mime_type: mime,
          });

          
        }
      }
    };

    // Ejecutar procesamiento desde basePath
    await procesarCarpeta(basePath, codigoExpediente);

    return {
      message: `Expediente "${savedExpediente.nombre}" importado correctamente y subido a MinIO`,
      expedienteId: savedExpediente.id,
      bucket,
      baseKey: expedienteBaseKey,
    };
  } finally {
    // Eliminar directorio temporal siempre
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {
      // No bloquear si falla limpieza
      console.warn('No se pudo eliminar temporal:', tmpDir, e);
    }
  }
}

  //console.log('HTML a procesar:', html.substring(0, 7000));
}
