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
  async uploadExpediente(file: Multer.File) {
    const bucket = 'ctd-imports';
    if (!file.originalname.endsWith('.zip')) {
      throw new BadRequestException(
        'Solo se aceptan archivos .zip para expedientes.',
      );
    }

    const expedienteNombre = this.limpiarNombre(
      path.basename(file.originalname, '.zip'),
    );
    const filePath = path.resolve('uploads/expedientes', file.originalname);

    await this.minioService.uploadFile(bucket, file.originalname, filePath);

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

  // 📁 Subida de módulo ZIP
  async uploadModulo(file: Multer.File) {
    const bucket = 'ctd-imports';
    if (!file.originalname.endsWith('.zip')) {
      throw new BadRequestException(
        'Solo se aceptan archivos .zip para módulos.',
      );
    }

    const moduloNombre = this.limpiarNombre(
      path.basename(file.originalname, '.zip'),
    );
    const filePath = path.resolve('uploads/modulos', file.originalname);

    await this.minioService.uploadFile(bucket, file.originalname, filePath);

    const modulo = this.moduloRepo.create({
      titulo: moduloNombre,
      descripcion: `Módulo cargado manualmente desde archivo ZIP (${file.originalname})`,
      estado: ModuloEstado.BORRADOR,
      numero: 1,
    });
    await this.moduloRepo.save(modulo);

    return {
      message: 'Módulo subido y registrado correctamente.',
      bucket,
      fileName: file.originalname,
      moduloId: modulo.id,
    };
  }

  // 📄 Subida de documentos (no ZIP)
  async uploadDocumentos(
    files: Multer.File[],
    tipos: string[] | string,
    creado_por?: string,
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

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tipoInput = tiposArray[i]?.toLowerCase();

      if (path.extname(file.originalname).toLowerCase() === '.zip') {
        throw new BadRequestException(
          `No se permiten archivos .zip (${file.originalname}).`,
        );
      }
      console.log('nombre', file.originalname);

      const filePath = path.resolve('uploads/documentos', file.originalname);
      const nombreLimpio = this.limpiarNombre(file.originalname);
      const nombreBase = path.parse(file.originalname).name.toLowerCase();
      console.log('nombreLIMPIO', nombreLimpio);
      await this.minioService.uploadFile(bucket, file.originalname, filePath);

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

      // Crear el registro en Documentos
      const doc = this.documentoRepo.create({
        nombre: nombreLimpio,
        tipo: tipoFinal,
        version: 1,
        ruta_archivo: filePath,
        mime_type: file.mimetype,
      });
      const savedDoc = await this.documentoRepo.save(doc);
      guardados.push({ ...savedDoc, nombreBase });

      // 🧩 Si es una plantilla Word, extraer configuración y crear registro
      if (
        tipoFinal === DocumentoTipo.PLANTILLA &&
        file.mimetype ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const config = await this.extraerConfiguracionPlantillaWord(filePath);

        const plantilla = this.plantillaRepo.create({
          nombre: `Plantilla_${nombreLimpio}`,
          descripcion: `Plantilla creada desde ${file.originalname}`,
          tipo_archivo: file.mimetype,
          
          creado_por: creado_por ? ({ id: creado_por } as any) : undefined,
          ...config,
        });

        await this.plantillaRepo.save(plantilla);
      }
    }

    // 🔗 Vincular anexos automáticamente
    for (const doc of guardados) {
      const relacionados = guardados.filter(
        (d) =>
          d.nombre === doc.nombre &&
          d.id !== doc.id &&
          d.tipo !== DocumentoTipo.PLANTILLA,
      );

      if (relacionados.length > 0) {
        const documento = await this.documentoRepo.findOne({
          where: { id: doc.id },
          relations: ['anexos'],
        });
        if (documento) {
          documento.anexos = [...(documento.anexos || []), ...relacionados];
          await this.documentoRepo.save(documento);
        }
      }
    }

    return {
      message:
        'Documentos subidos, registrados y vinculados correctamente (incluyendo plantillas con configuración de Word).',
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

  private async extraerConfiguracionPlantillaWord(
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

  //console.log('HTML a procesar:', html.substring(0, 7000));
}
