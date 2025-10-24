import { MinioService } from '../minio.service';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  TableOfContents,
  WidthType,
  PageBreak,
} from 'docx';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documento, DocumentoTipo } from './entities/documento.entity';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import { Modulo } from '../modulos/entities/modulo.entity';
import { User } from '../users/entities/user.entity';
import { HistorialService } from '../historial/historial.service';
import { HistorialAccion } from '../historial/entities/historial_documento.entity';
import * as fs from 'fs';
import { ModulosService } from '../modulos/modulos.service';
import { Plantilla } from '../plantillas/entities/plantilla.entity';
import * as os from 'os';
import { estructuraToDocxChildren } from 'src/utils/plantillas/convert-Json-to-Docxs';
import JSZip from 'jszip';
@Injectable()
export class DocumentosService {
  constructor(
    @InjectRepository(Documento)
    private readonly documentoRepo: Repository<Documento>,

    @InjectRepository(Modulo)
    private readonly moduloRepo: Repository<Modulo>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Plantilla)
    private readonly plantillaRepo: Repository<Plantilla>,

    private readonly historialService: HistorialService, // ✅ inyección del historial
    private readonly minioService: MinioService,
    private readonly modulosService: ModulosService,
  ) {}

  // Crear documento Word con índice y capítulos
  async crearDocumentoWord(body: {
    titulo: string;
    encabezado?: string;
    capitulos?: {
      titulo: string;
      contenido?: string;
      subCapitulos?: {
        titulo: string;
        contenido?: string;
        tablas?: { encabezados: string[]; filas: string[][] }[];
        anexos?: string[];
      }[];
      tablas?: { encabezados: string[]; filas: string[][] }[];
      placeholders?: string[];
    }[];
    moduloId?: string;
    anexos?: string[];
    subido_por?: string;
  }) {
    const { titulo, encabezado, capitulos, moduloId, anexos, subido_por } =
      body;

    const children: (Paragraph | Table)[] = [];

    // --- Título principal ---
    children.push(
      new Paragraph({
        text: titulo,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        style: 'Title',
      }),
    );

    // --- Índice automático ---
    (new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: "⚠️ Para ver correctamente la tabla de contenido, presione F9 y elija 'Actualizar toda la tabla'.",
          font: 'Arial',
          color: 'FF0000',
          italics: true,
        }),
      ],
    }),
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: 'Indice',
              bold: true,
              font: 'Arial',
              color: '000000',
              size: 28,
            }),
          ],
        }),
      ));

    children.push(
      new TableOfContents('Tabla de Contenido', {
        hyperlink: true,
        headingStyleRange: '1-2',
      }),
    );

    children.push(new Paragraph({ children: [], pageBreakBefore: true }));

    let modulo: Modulo | undefined = undefined;
    if (moduloId)
      modulo =
        (await this.moduloRepo.findOne({
          where: { id: moduloId },
          relations: [
            'expediente',
            'documentos',
            'submodulos',
            'submodulos.documentos',
            'moduloContenedor',
          ],
        })) ?? undefined;

    let anexosDocs: Documento[] = [];
    if (anexos && anexos.length > 0) {
      console.log('ANEXOS existe', anexosDocs);
      anexosDocs = await this.documentoRepo.findByIds(anexos);
    }
    console.log('ANEXOS', anexosDocs);

    // --- Capítulos y subcapítulos ---
    if (capitulos && capitulos.length > 0) {
      for (const [i, cap] of capitulos.entries()) {
        if (i > 0)
          children.push(new Paragraph({ children: [], pageBreakBefore: true }));

        // Capítulo principal
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: `${i + 1}. ${cap.titulo}`,
                bold: true,
                color: '000000',
                font: 'Arial',
                size: 32, // 12pt
              }),
            ],
            spacing: { after: 200 },
          }),
        );

        // Contenido del capítulo
        if (cap.contenido) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cap.contenido,
                  font: 'Arial',
                  color: '000000',
                  size: 24, // 12pt
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 150 },
            }),
          );
        }

        // Tablas del capítulo
        if (cap.tablas) {
          cap.tablas.forEach((tabla) => {
            const rows = [
              new TableRow({
                children: tabla.encabezados.map(
                  (h) =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: h,
                              bold: true,
                              font: 'Arial',
                              color: '000000',
                            }),
                          ],
                        }),
                      ],
                    }),
                ),
              }),
              ...tabla.filas.map(
                (fila) =>
                  new TableRow({
                    children: fila.map(
                      (col) =>
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: col,
                                  font: 'Arial',
                                  color: '000000',
                                }),
                              ],
                            }),
                          ],
                        }),
                    ),
                  }),
              ),
            ];
            children.push(
              new Table({
                rows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
            );
          });
        }

        // Subcapítulos
        if (cap.subCapitulos && cap.subCapitulos.length > 0) {
          for (const [j, sub] of cap.subCapitulos.entries()) {
            children.push(
              new Paragraph({
                heading: HeadingLevel.HEADING_2,
                children: [
                  new TextRun({
                    text: `${i + 1}.${j + 1} ${sub.titulo}`,
                    bold: true,
                    color: '000000',
                    font: 'Arial',
                    size: 28,
                  }),
                ],
                spacing: { after: 150 },
              }),
            );

            if (sub.contenido) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: sub.contenido,
                      font: 'Arial',
                      color: '000000',
                      size: 24,
                    }),
                  ],
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: { after: 100 },
                }),
              );
            }

            // --- Tablas del subcapítulo ---
            if (sub.tablas && sub.tablas.length > 0) {
              for (const tabla of sub.tablas) {
                const rows = [
                  new TableRow({
                    children: tabla.encabezados.map(
                      (h) =>
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: h,
                                  bold: true,
                                  font: 'Arial',
                                  color: '000000',
                                }),
                              ],
                            }),
                          ],
                        }),
                    ),
                  }),
                  ...tabla.filas.map(
                    (fila) =>
                      new TableRow({
                        children: fila.map(
                          (col) =>
                            new TableCell({
                              children: [
                                new Paragraph({
                                  children: [
                                    new TextRun({
                                      text: col,
                                      font: 'Arial',
                                      color: '000000',
                                    }),
                                  ],
                                }),
                              ],
                            }),
                        ),
                      }),
                  ),
                ];

                children.push(
                  new Table({
                    rows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                  }),
                );
              }
            }

            // --- Anexos del subcapítulo ---
            if (sub.anexos && sub.anexos.length > 0) {
              console.log('📎 Subanexos detectados:', sub.anexos);
              console.log(`📄 Total párrafos generados: ${children.length}`);

              const subAnexos = await this.documentoRepo.findByIds(sub.anexos);
              console.log('📎 Subanexos detectados:', subAnexos);
              for (const a of subAnexos) {
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Ver anexo: ${a.nombre}`,
                        font: 'Arial',
                        color: '000000',
                        size: 24,
                        italics: true,
                      }),
                    ],
                    spacing: { after: 100 },
                  }),
                );
              }
            }
          }
        }
      }
    }

    // --- Encabezado ---
    const header = encabezado
      ? new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: encabezado,
                  bold: true,
                  font: 'Arial',
                  color: '000000',
                  size: 24,
                }),
                new TextRun({ text: '\tPágina ', font: 'Arial', size: 24 }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: 'Arial',
                  size: 24,
                }),
                new TextRun(' de '),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  font: 'Arial',
                  size: 24,
                }),
              ],
              tabStops: [{ type: 'right', position: 9000 }],
            }),
          ],
        })
      : undefined;

    // --- Pie de página ---
    const footer = new Footer({
      children: [
        new Paragraph({
          children: [
            new TextRun('Página '),
            new TextRun({ children: [PageNumber.CURRENT] }),
            new TextRun(' de '),
            new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    });

    console.log(`📄 Total párrafos generados: ${children.length}`);

    // --- Crear documento ---
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          headers: header ? { default: header } : {},
          footers: { default: footer },
          children,
        },
      ],
    });

    // --- Guardar archivo ---
    const uploadsPath = path.join('uploads', 'documentos');
    if (!fs.existsSync(uploadsPath))
      mkdirSync(uploadsPath, { recursive: true });
    const fileName = `${Date.now()}_${titulo.replace(/\s/g, '_')}.docx`;
    const filePath = path.join(uploadsPath, fileName);

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    // --- Asociar a módulo si corresponde ---

    const destinoMinio = modulo
      ? `${modulo.ruta}/${fileName}`
      : `documentos/${fileName}`;

    await this.minioService.uploadFile(
      'ctd-expedientes',
      destinoMinio,
      filePath,
    );

    const subidoPorUser = subido_por
      ? await this.userRepo.findOne({ where: { id: subido_por } })
      : undefined;

    const docEntity = this.documentoRepo.create({
      nombre: fileName,
      tipo: DocumentoTipo.PLANTILLA,
      ruta_archivo: destinoMinio,
      modulo,
      version: 1,
      mime_type:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      subido_por: subidoPorUser || undefined,
      anexos: anexosDocs,
    });

    return (
      this.documentoRepo.save(docEntity),
      modulo?.moduloContenedor
        ? this.modulosService.actualizarIndiceModulo(
            modulo?.moduloContenedor.id,
          )
        : null
    );
  }

  // Editar documento Word (agrega contenido/capítulos)
  async editarDocumentoWord(
    id: string,
    body: { contenido: string; capitulos?: string[] },
  ) {
    const docEntity = await this.documentoRepo.findOne({ where: { id } });
    if (!docEntity) throw new NotFoundException('Documento no encontrado');
    // Leer y modificar el documento existente
    const docx = require('docx');
    const fs = require('fs');
    const buffer = fs.readFileSync(docEntity.ruta_archivo);
    // No hay soporte oficial para editar docx, así que se crea uno nuevo con el contenido adicional
    const doc = new docx.Document({
      sections: [
        {
          children: [
            new docx.Paragraph({
              text: body.contenido,
              heading: docx.HeadingLevel.HEADING_1,
            }),
            ...(body.capitulos || []).map(
              (c, i) => new docx.Paragraph(`Capítulo ${i + 1}: ${c}`),
            ),
          ],
        },
      ],
    });
    const newBuffer = await docx.Packer.toBuffer(doc);
    fs.writeFileSync(docEntity.ruta_archivo, newBuffer);
    await this.minioService.uploadFile(
      'ctd-documentos',
      docEntity.nombre,
      docEntity.ruta_archivo,
    );

    return { message: 'Documento Word editado y subido a MinIO.' };
  }

  // Crear PDF con índice y capítulos
  async crearDocumentoPDF(body: {
    titulo: string;
    capitulos: string[];
    moduloId?: string;
    expedienteId?: string;
  }) {
    const { titulo, capitulos, moduloId } = body;
    const uploadsPath = path.join('uploads', 'documentos');
    if (!existsSync(uploadsPath)) mkdirSync(uploadsPath, { recursive: true });
    const fileName = `${Date.now()}_${titulo.replace(/\s/g, '_')}.pdf`;
    const filePath = path.join(uploadsPath, fileName);
    const doc = new PDFDocument();
    const stream = createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(20).text(titulo, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('Índice');
    capitulos.forEach((c, i) => doc.text(`${i + 1}. ${c}`));
    doc.addPage();
    capitulos.forEach((c, i) => {
      doc.fontSize(16).text(`Capítulo ${i + 1}: ${c}`);
      doc.moveDown();
    });
    doc.end();
    await new Promise<void>((resolve) => stream.on('finish', resolve));
    await this.minioService.uploadFile('ctd-documentos', fileName, filePath);
    let modulo: Modulo | undefined = undefined;

    if (moduloId)
      modulo =
        (await this.moduloRepo.findOne({ where: { id: moduloId } })) ??
        undefined;
    if (modulo) {
      const destinoMinio = `${modulo.ruta}/${fileName}`;
      await this.minioService.uploadFile(
        'ctd-expedientes',
        destinoMinio,
        filePath,
      );
    }
    const docEntity = this.documentoRepo.create({
      nombre: fileName,
      tipo: DocumentoTipo.PLANTILLA,
      ruta_archivo: filePath,
      modulo,
      mime_type: 'application/pdf',
    });
    return this.documentoRepo.save(docEntity);
  }

  // Editar PDF (agrega contenido/capítulos)
  async editarDocumentoPDF(
    id: string,
    body: { contenido: string; capitulos?: string[] },
  ) {
    const docEntity = await this.documentoRepo.findOne({ where: { id } });
    if (!docEntity) throw new NotFoundException('Documento no encontrado');
    // No hay edición directa de PDF, así que se crea uno nuevo con el contenido adicional
    const filePath = docEntity.ruta_archivo;
    const doc = new PDFDocument();
    const stream = createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(16).text(body.contenido, { align: 'left' });
    (body.capitulos || []).forEach((c, i) => {
      doc.moveDown();
      doc.fontSize(14).text(`Capítulo ${i + 1}: ${c}`);
    });
    doc.end();
    await new Promise<void>((resolve) => stream.on('finish', resolve));
    await this.minioService.uploadFile(
      'ctd-documentos',
      docEntity.nombre,
      filePath,
    );
    return { message: 'PDF editado y subido a MinIO.' };
  }

  // Crear plantilla desde documento subido
  async crearPlantillaDesdeDocumento(
    file: any,
    body: { moduloId?: string; expedienteId?: string },
  ) {
    const { moduloId } = body;
    await this.minioService.uploadFile(
      'ctd-documentos',
      file.filename,
      file.path,
    );
    let modulo: Modulo | undefined = undefined;
    if (moduloId)
      modulo =
        (await this.moduloRepo.findOne({ where: { id: moduloId } })) ??
        undefined;
    if (modulo) {
      const destinoMinio = `${modulo.ruta}/${file.filename}`;
      await this.minioService.uploadFile(
        'ctd-expedientes',
        destinoMinio,
        file.path,
      );
    }
    const docEntity = this.documentoRepo.create({
      nombre: file.filename,
      tipo: DocumentoTipo.PLANTILLA,
      ruta_archivo: file.path,
      modulo,
      mime_type: file.mimetype,
    });
    return this.documentoRepo.save(docEntity);
  }

  //Crear un nuevo documento

  

async  createFromPlantilla(createDto: CreateDocumentoDto & { plantilla_id: string }) {
  const { plantilla_id, modulo_id, subido_por, anexos, ...rest } = createDto;

  // 1️⃣ Buscar plantilla
  const plantilla = await this.plantillaRepo.findOne({
    where: { id: plantilla_id },
    relations: ['documento'],
  });
  if (!plantilla) throw new NotFoundException('Plantilla no encontrada.');

  // 2️⃣ Buscar módulo
  const modulo = await this.moduloRepo.findOne({ where: { id: modulo_id } });
  if (!modulo) throw new NotFoundException('Módulo no encontrado.');

  // 3️⃣ Buscar usuario
  let user: User | undefined = undefined;
    if (subido_por) {
      const foundUser = await this.userRepo.findOne({
        where: { id: subido_por },
      });
      if (!foundUser) throw new NotFoundException('Usuario no encontrado.');
      user = foundUser;
    }

  // 4️⃣ Buscar anexos
  let anexosDocs: Documento[] = [];
  if (anexos?.length) {
    const validos = anexos.filter((a) => a?.trim() !== '');
    if (validos.length) anexosDocs = await this.documentoRepo.findByIds(validos);
  }

  // 5️⃣ Crear documento en DB (metadata)
  const documento = this.documentoRepo.create({
    ...rest,
    tipo: (rest.tipo as DocumentoTipo) || DocumentoTipo.OTRO,
    version: rest.version || 1,
    modulo,
    subido_por: user,
    anexos: anexosDocs,
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  // 6️⃣ Generar contenido Word con docx
  const children: any[] = [];

  // Título principal
  if (plantilla.titulo) {
    children.push(
      new Paragraph({
        text: plantilla.titulo,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
    );
  }

  // Índice automático
  children.push(new TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-2' }));

  // Contenido dinámico desde la estructura
  const cuerpo = estructuraToDocxChildren(plantilla.estructura);
  ;
  
  children.push(...cuerpo);
console.log("CHILDREN",children)
  // Crear documento base con docx
  const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'num',
        levels: [
          { level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START },
        ],
      },
    ],
  },
  sections: [{ children }],
});
;

  // Guardar temporalmente
  const tempPath = path.join(os.tmpdir(), `${rest.nombre || 'documento'}.docx`);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(tempPath, buffer);

  

  // 8️⃣ Subir a MinIO
  const destinoMinio = modulo ? `${modulo.ruta}/${rest.nombre}.docx` : `documentos/${rest.nombre}.docx`;
  await this.minioService.uploadFile('ctd-expedientes', destinoMinio, tempPath);

  // 9️⃣ Guardar ruta en DB
  documento.ruta_archivo = destinoMinio;
  const saved = await this.documentoRepo.save(documento);

  // 🔟 Registrar historial
  await this.historialService.create({
    documento_id: saved.id,
    version: saved.version,
    accion: HistorialAccion.CREADO,
    usuario_id: user?.id,
    comentario: 'Documento creado a partir de plantilla.',
  });

  return saved;
}


  // Listar todos los documentos
  async findAll() {
    return this.documentoRepo.find({
      relations: ['modulo', 'subido_por'],
    });
  }

  // Obtener un documento específico
  async findOne(id: string) {
    const doc = await this.documentoRepo.findOne({
      where: { id },
      relations: ['modulo', 'subido_por'],
    });
    if (!doc) throw new NotFoundException('Documento no encontrado.');
    return doc;
  }

  // Actualizar documento (incrementa versión y registra historial)
  async update(id: string, updateDto: UpdateDocumentoDto) {
    const documento = await this.documentoRepo.findOne({ where: { id } });
    if (!documento) throw new NotFoundException('Documento no encontrado.');

    Object.assign(documento, updateDto);
    documento.version = (documento.version || 0) + 1; // ✅ incremento de versión

    const updated = await this.documentoRepo.save(documento);

    // Subir archivo actualizado a MinIO si hay ruta de archivo
    if (updated.ruta_archivo && updated.nombre) {
      try {
        await this.minioService.uploadFile(
          'ctd-documentos',
          updated.nombre,
          updated.ruta_archivo,
        );
      } catch (e) {
        // Manejar error de subida a MinIO (opcional: log)
      }
    }

    // ✅ Registrar historial automático
    await this.historialService.create({
      documento_id: updated.id,
      version: updated.version,
      accion: HistorialAccion.MODIFICADO,
      usuario_id: updateDto.subido_por,
      comentario: 'Documento actualizado automáticamente.',
    });

    return updated;
  }

  // Eliminar documento (y registrar historial)
  async remove(id: string) {
    const documento = await this.documentoRepo.findOne({ where: { id } });
    if (!documento) throw new NotFoundException('Documento no encontrado.');
    // Eliminar de MinIO si existe
    try {
      await this.minioService.removeObject('ctd-documentos', documento.nombre);
    } catch (e) {
      // Si no existe en MinIO, continuar
    }
    await this.documentoRepo.remove(documento);

    // ✅ Registrar historial automático
    await this.historialService.create({
      documento_id: id,
      version: documento.version,
      accion: HistorialAccion.ELIMINADO,
      usuario_id: documento.subido_por?.id,
      comentario: 'Documento eliminado del sistema y de MinIO.',
    });

    return { message: 'Documento eliminado correctamente.' };
  }
}
