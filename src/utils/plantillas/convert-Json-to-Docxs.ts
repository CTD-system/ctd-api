import {
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  ImageRun,
  HeadingLevel,
  WidthType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  HeightRule,
  TableLayoutType,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import sizeOf from 'image-size';
// 🔹 Limpia caracteres no válidos para Word
const sanitize = (text: string = ''): string =>
  text.replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\uFFFF]/g, '');

export function estructuraToDocxChildren(estructura: any): any[] {
  const children: any[] = [];
  let capCounter = 0; // contador global de capítulos
  let lastListNumber = 0; // última numeración de lista ordenada

  // 🔹 función auxiliar para convertir "bloque.textos" con estilos
  const parseStyledText = (items: any[]): TextRun[] => {
    if (!items || !Array.isArray(items)) return [];

    return items.map((item) => {
      if (typeof item === 'string')
        return new TextRun({ text: sanitize(item), color: '000000', size: 24 });

      return new TextRun({
        text: sanitize(item.texto || item.text || ''),
        bold: !!item.bold || item.tag === 'strong' || item.tag === 'b',
        italics: !!item.italics || item.tag === 'em' || item.tag === 'i',
        subScript: item.tag === 'sub',
        superScript: item.tag === 'sup',
        color: item.color || '000000',
        underline: item.tag === 'a' ? {} : undefined,
        style: item.style,
        size: 24,
      });
    });
  };

  const processBloques = (bloques: any[], nivel = 0) => {
    for (const bloque of bloques) {
      console.log('BLOQUE', bloque);

      switch (bloque.tipo) {
        // ------------------ CAPÍTULO ------------------
        case 'capitulo':
          capCounter = Math.max(capCounter + 1, lastListNumber + 1);

          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${capCounter}. ${sanitize(bloque.titulo || '')}`,
                  bold: true,
                  color: '000000',
                  size: 26,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 100 },
              indent: { left: 0 },
            }),
          );

          if (bloque.bloques) processBloques(bloque.bloques, 1);
          break;

        // ------------------ SUBCAPÍTULO ------------------
        case 'subcapitulo':
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${capCounter}.${nivel} ${sanitize(bloque.titulo || '')}`,
                  bold: true,
                  color: '000000',
                  size: 24,
                }),
              ],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 150, after: 80 },
              indent: { left: 400 * nivel },
            }),
          );

          if (bloque.bloques) processBloques(bloque.bloques, nivel + 1);
          break;

        // ------------------ PÁRRAFO ------------------
        case 'parrafo':
          children.push(
            new Paragraph({
              children: bloque.textos
                ? parseStyledText(bloque.textos)
                : [
                    new TextRun({
                      text: sanitize(bloque.texto_plano || ''),
                      color: '000000',
                      size: 24,
                    }),
                  ],
              spacing: { after: 100 },
              indent: { left: 400 * nivel },
            }),
          );
          break;

        // ------------------ LISTA ORDENADA ------------------
        case 'lista_ol':
          bloque.items?.forEach((item: any, idx: number) => {
            lastListNumber = idx + 1;
            children.push(
              new Paragraph({
                children: parseStyledText(
                  item.textos || [{ text: item.texto_plano }],
                ),
                numbering: { reference: 'num', level: nivel },
                indent: { left: 400 * nivel },
              }),
            );
          });
          break;

        // ------------------ LISTA NO ORDENADA ------------------
        case 'lista_ul':
          bloque.items?.forEach((item: any) => {
            children.push(
              new Paragraph({
                children: parseStyledText(
                  item.textos || [{ text: item.texto_plano }],
                ),
                bullet: { level: nivel },
                indent: { left: 400 * nivel },
              }),
            );
          });
          break;

        // ------------------ TABLA ------------------

        case 'tabla': {
          // Función recursiva para crear celdas de la tabla (incluyendo manejo de colSpan y celdas anidadas)
          const crearCelda = (celda: any) => {
            // Verificamos si la celda es una tabla anidada
            if (celda && celda.tipo === 'tabla_anidada') {
              return new TableCell({
                children: [crearTablaDocx(celda.tabla)], // Recursividad para la tabla anidada
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 50, bottom: 50, left: 50, right: 50 }, // Márgenes para la celda
              });
            }

            // Si la celda es un array, unir todos los textos en uno solo
            if (Array.isArray(celda)) {
              const textoCompleto = celda
                .map((sub: any) => {
                  if (sub.tipo === 'tabla_anidada')
                    return crearTablaDocx(sub.tabla); // Recursividad para tablas anidadas
                  return sub.text || sub.texto || ''; // Obtener texto de la celda
                })
                .join(' ');

              return new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: textoCompleto,
                        size: 22,
                        font: 'Arial',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 0 },
                  }),
                ],
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
              });
            }

            // Celda normal
            let texto = '';
            if (celda && typeof celda === 'object') {
              texto = celda.text || celda.texto || ''; // Obtener texto de la celda
            } else {
              texto = String(celda || ''); // Asegurarse de que sea un string
            }

            // Si el texto es un array, unirlo
            if (Array.isArray(texto)) {
              texto = texto.join(' ');
            }

            return new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: texto, size: 22, font: 'Arial' }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: 0 },
                }),
              ],
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 50, bottom: 50, left: 50, right: 50 },
              columnSpan: celda?.colSpan || 1, // Establecer el colSpan
              rowSpan: celda?.rowSpan || 1, // Establecer el rowSpan
            });
          };

          // Función recursiva para crear la tabla completa (incluyendo encabezados con colSpan)
          const crearTablaDocx = (tabla: any): Table => {
            const filas = tabla.filas?.map((fila: any[]) => {
              const celdas = fila.map((celda: any) => crearCelda(celda)); // Crear las celdas de cada fila
              return new TableRow({
                children: celdas,
              });
            });

            // Procesar encabezados - separar en filas según colSpan
            let filasEncabezados: TableRow[] = [];

            if (tabla.encabezados?.length > 0) {
              // Detectar si hay encabezados con colSpan mayor a 1
              const tieneEncabezadoPrincipal = tabla.encabezados.some(
                (h: any) =>
                  (h?.colSpan && h.colSpan > 1) ||
                  (typeof h === 'object' && h.colSpan > 1),
              );

              if (tieneEncabezadoPrincipal) {
                // Crear fila principal con encabezados que tienen colSpan grande
                const encabezadosPrincipales = tabla.encabezados.filter(
                  (h: any) =>
                    (h?.colSpan && h.colSpan > 1) ||
                    (typeof h === 'object' && h.colSpan > 1),
                );

                // Crear fila secundaria con encabezados normales
                const encabezadosSecundarios = tabla.encabezados.filter(
                  (h: any) => !h?.colSpan || h.colSpan === 1,
                );

                // Agregar fila principal si existe
                if (encabezadosPrincipales.length > 0) {
                  filasEncabezados.push(
                    new TableRow({
                      children: encabezadosPrincipales.map((h: any) => {
                        let textoEncabezado = '';
                        if (typeof h === 'string') {
                          textoEncabezado = h;
                        } else if (h && typeof h === 'object') {
                          textoEncabezado = h.text || h.texto || '';
                        }

                        return new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: textoEncabezado,
                                  bold: true,
                                  size: 22,
                                  font: 'Arial',
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                              spacing: { before: 0, after: 0 },
                            }),
                          ],
                          shading: {
                            fill: 'D9D9D9',
                            type: ShadingType.CLEAR,
                          },
                          columnSpan: h?.colSpan || 1,
                          rowSpan: h?.rowSpan || 1,
                          verticalAlign: VerticalAlign.CENTER,
                        });
                      }),
                    }),
                  );
                }

                // Agregar fila secundaria si existe
                if (encabezadosSecundarios.length > 0) {
                  filasEncabezados.push(
                    new TableRow({
                      children: encabezadosSecundarios.map((h: any) => {
                        let textoEncabezado = '';
                        if (typeof h === 'string') {
                          textoEncabezado = h;
                        } else if (h && typeof h === 'object') {
                          textoEncabezado = h.text || h.texto || '';
                        }

                        return new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: textoEncabezado,
                                  bold: true,
                                  size: 22,
                                  font: 'Arial',
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                              spacing: { before: 0, after: 0 },
                            }),
                          ],
                          shading: {
                            fill: 'D9D9D9',
                            type: ShadingType.CLEAR,
                          },
                          columnSpan: h?.colSpan || 1,
                          rowSpan: h?.rowSpan || 1,
                          verticalAlign: VerticalAlign.CENTER,
                        });
                      }),
                    }),
                  );
                }
              } else {
                // Si no hay encabezados especiales, crear fila normal
                filasEncabezados.push(
                  new TableRow({
                    children: tabla.encabezados.map((h: any) => {
                      let textoEncabezado = '';
                      if (typeof h === 'string') {
                        textoEncabezado = h;
                      } else if (h && typeof h === 'object') {
                        textoEncabezado = h.text || h.texto || '';
                      }

                      return new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: textoEncabezado,
                                bold: true,
                                size: 22,
                                font: 'Arial',
                              }),
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 0, after: 0 },
                          }),
                        ],
                        shading: {
                          fill: 'D9D9D9',
                          type: ShadingType.CLEAR,
                        },
                        columnSpan: h?.colSpan || 1,
                        rowSpan: h?.rowSpan || 1,
                        verticalAlign: VerticalAlign.CENTER,
                      });
                    }),
                  }),
                );
              }
            }

            // Devolver la tabla construida
            return new Table({
              rows: [...filasEncabezados, ...(filas || [])],
              width: { size: '100%', type: WidthType.AUTO }, // Auto-ajustar el tamaño de las celdas
              borders: {
                top: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
                bottom: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
                left: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
                right: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
                insideHorizontal: {
                  style: BorderStyle.SINGLE,
                  size: 2,
                  color: '000000',
                },
                insideVertical: {
                  style: BorderStyle.SINGLE,
                  size: 2,
                  color: '000000',
                },
              },
            });
          };

          // Insertar la tabla si tiene encabezados o filas
          if (
            (bloque.encabezados && bloque.encabezados.length > 0) ||
            (bloque.filas && bloque.filas.length > 0)
          ) {
            children.push(crearTablaDocx(bloque));
          }
          break;
        }

        // ------------------ IMAGEN ------------------
    
case 'imagen':
  if (bloque.src) {
    let imgBuffer: Buffer | null = null;
    let tipo: 'png' | 'jpg' = 'png';

    // 📌 Si es un data URI (base64)
    const dataUriMatch = bloque.src.match(/^data:image\/(png|jpeg|jpg);base64,(.*)$/);
    if (dataUriMatch) {
      const ext = dataUriMatch[1];
      const base64Data = dataUriMatch[2];
      imgBuffer = Buffer.from(base64Data, 'base64');
      tipo = ext === 'jpeg' || ext === 'jpg' ? 'jpg' : 'png';
    } 
    // 📌 Si es ruta de archivo local
    else if (fs.existsSync(bloque.src)) {
      imgBuffer = fs.readFileSync(bloque.src);
      const ext = path.extname(bloque.src).toLowerCase().replace('.', '');
      tipo = ext === 'jpg' || ext === 'jpeg' ? 'jpg' : 'png';
    }

    if (imgBuffer) {
      // ✅ Obtener dimensiones reales de la imagen
      const dimensions = sizeOf(imgBuffer);

      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: imgBuffer,
              type: tipo,
              transformation: {
                width: dimensions.width || 100,   // fallback por si falla
                height: dimensions.height || 100, // fallback por si falla
              },
            }),
          ],
          spacing: { before: 150, after: 150 },
        }),
      );
    }
  }
  break;


        // ------------------ BLOQUE DESCONOCIDO ------------------
        default:
          if (bloque.bloques) processBloques(bloque.bloques, nivel);
          break;
      }
    }
  };

  processBloques(estructura.bloques || []);
  return children;
}
