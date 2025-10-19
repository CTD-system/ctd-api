// import {
//   Body,
//   Controller,
//   Param,
//   Post,
//   UploadedFile,
//   UseInterceptors,
// } from '@nestjs/common';
// import { DocumentosService } from './documentos.service';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

// @ApiTags('Documentos') // ✅ Agrupa todo bajo "Documentos" en Swagger
// @Controller('documentos')
// export class DocumentosDocController {
//   constructor(private readonly documentosService: DocumentosService) {}

//   // 📝 Crear documento Word
//   @Post('word/create')
//   @ApiOperation({ summary: 'Crea un documento Word desde el contenido enviado' })
//   @ApiBody({
//     schema: {
//       type: 'object',
//       properties: {
//         titulo: { type: 'string', example: 'Informe Técnico' },
//         capitulos: {
//           type: 'array',
//           items: { type: 'string' },
//           example: ['Introducción', 'Desarrollo', 'Conclusión'],
//         },
//         moduloId: { type: 'string', example: 'uuid-del-modulo', nullable: true },
//         expedienteId: { type: 'string', example: 'uuid-del-expediente', nullable: true },
//       },
//     },
//   })
//   async crearWord(
//     @Body()
//     body: {
//       titulo: string;
//       capitulos: string[];
//       moduloId?: string;
//       expedienteId?: string;
//     },
//   ) {
//     return this.documentosService.crearDocumentoWord(body);
//   }

//    @Post('generar-profesional')
//   @ApiBody({
//     description: 'Genera un documento Word profesional con formato estructurado',
//     schema: {
//       type: 'object',
//       properties: {
//         titulo: { type: 'string', example: 'Ficha de Seguridad - Docetaxel' },
//         encabezado: {
//           type: 'string',
//           example: 'Laboratorios AICA - Confidencial',
//         },
//         secciones: {
//           type: 'array',
//           items: {
//             type: 'object',
//             properties: {
//               tipo: {
//                 type: 'string',
//                 enum: ['titulo', 'subtitulo', 'parrafo', 'lista', 'tabla'],
//                 example: 'titulo',
//               },
//               texto: { type: 'string', example: '1. Identificación del producto' },
//               items: {
//                 type: 'array',
//                 items: { type: 'string' },
//                 example: ['Evitar exposición directa a la luz.'],
//               },
//               encabezados: {
//                 type: 'array',
//                 items: { type: 'string' },
//                 example: ['Nombre', 'Cantidad', 'Función'],
//               },
//               filas: {
//                 type: 'array',
//                 items: {
//                   type: 'array',
//                   items: { type: 'string' },
//                   example: ['Docetaxel', '80 mg', 'Principio activo'],
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   })
//   @ApiResponse({
//     status: 201,
//     description: 'Documento generado exitosamente',
//     schema: {
//       example: {
//         message: 'Documento profesional generado',
//         filePath: 'uploads/documentos/1734392834_Ficha_de_Seguridad_Docetaxel.docx',
//       },
//     },
//   })
//   async generarDocumento(@Body() body: any) {
//     return this.documentosService.generarDocumentoProfesional(body);
//   }

//   // 📝 Editar documento Word existente
//   @Post('word/edit/:id')
//   @ApiOperation({ summary: 'Edita un documento Word existente' })
//   @ApiParam({ name: 'id', description: 'ID del documento Word', example: 'uuid-del-doc' })
//   @ApiBody({
//     schema: {
//       type: 'object',
//       properties: {
//         contenido: { type: 'string', example: 'Texto nuevo del documento...' },
//         capitulos: {
//           type: 'array',
//           items: { type: 'string' },
//           example: ['Capítulo 1', 'Capítulo 2'],
//         },
//       },
//     },
//   })
//   async editarWord(
//     @Param('id') id: string,
//     @Body() body: { contenido: string; capitulos?: string[] },
//   ) {
//     return this.documentosService.editarDocumentoWord(id, body);
//   }

//   // 🧾 Crear documento PDF
//   @Post('pdf/create')
//   @ApiOperation({ summary: 'Crea un documento PDF a partir de contenido y capítulos' })
//   @ApiBody({
//     schema: {
//       type: 'object',
//       properties: {
//         titulo: { type: 'string', example: 'Reporte de Resultados' },
//         capitulos: {
//           type: 'array',
//           items: { type: 'string' },
//           example: ['Resumen', 'Metodología', 'Resultados'],
//         },
//         moduloId: { type: 'string', example: 'uuid-del-modulo', nullable: true },
//         expedienteId: { type: 'string', example: 'uuid-del-expediente', nullable: true },
//       },
//     },
//   })
//   async crearPDF(
//     @Body()
//     body: {
//       titulo: string;
//       capitulos: string[];
//       moduloId?: string;
//       expedienteId?: string;
//     },
//   ) {
//     return this.documentosService.crearDocumentoPDF(body);
//   }

//   // 🧾 Editar documento PDF existente
//   @Post('pdf/edit/:id')
//   @ApiOperation({ summary: 'Edita un documento PDF existente' })
//   @ApiParam({ name: 'id', description: 'ID del documento PDF', example: 'uuid-del-doc' })
//   @ApiBody({
//     schema: {
//       type: 'object',
//       properties: {
//         contenido: { type: 'string', example: 'Texto actualizado del PDF...' },
//         capitulos: {
//           type: 'array',
//           items: { type: 'string' },
//           example: ['Capítulo 1', 'Capítulo 2'],
//         },
//       },
//     },
//   })
//   async editarPDF(
//     @Param('id') id: string,
//     @Body() body: { contenido: string; capitulos?: string[] },
//   ) {
//     return this.documentosService.editarDocumentoPDF(id, body);
//   }

//   // 📎 Crear plantilla desde documento subido
//   @Post('plantilla/crear-desde-documento')
//   @ApiOperation({ summary: 'Crea una plantilla a partir de un documento subido' })
//   @ApiConsumes('multipart/form-data')
//   @ApiBody({
//     schema: {
//       type: 'object',
//       properties: {
//         file: {
//           type: 'string',
//           format: 'binary',
//           description: 'Archivo Word o PDF a subir',
//         },
//         moduloId: { type: 'string', example: 'uuid-del-modulo', nullable: true },
//         expedienteId: { type: 'string', example: 'uuid-del-expediente', nullable: true },
//       },
//     },
//   })
//   @UseInterceptors(FileInterceptor('file'))
//   async crearPlantillaDesdeDocumento(
//     @UploadedFile() file: any,
//     @Body() body: { moduloId?: string; expedienteId?: string },
//   ) {
//     return this.documentosService.crearPlantillaDesdeDocumento(file, body);
//   }
// }
