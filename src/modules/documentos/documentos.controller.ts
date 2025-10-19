import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { DocumentosService } from './documentos.service';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Documentos')
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  // 📄 Crear documento
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo documento y asociarlo a un módulo' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', example: 'Informe Técnico' },
        tipo: { type: 'string', example: 'PLANTILLA' },
        ruta_archivo: { type: 'string', example: 'uploads/doc.docx' },
        modulo_id: { type: 'string', format: 'uuid', nullable: true },
        subido_por: { type: 'string', format: 'uuid', nullable: true },
        anexos: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          nullable: true,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Documento creado exitosamente' })
  create(@Body() createDto: CreateDocumentoDto) {
    return this.documentosService.create(createDto);
  }

  // 📄 Listar documentos
  @Get()
  @ApiOperation({ summary: 'Listar todos los documentos con módulo y usuario' })
  @ApiResponse({ status: 200, description: 'Documentos listados correctamente' })
  findAll() {
    return this.documentosService.findAll();
  }

  // 📄 Obtener documento por ID
  @Get(':id')
  @ApiOperation({ summary: 'Obtener documento por ID' })
  @ApiParam({ name: 'id', description: 'ID del documento', example: 'uuid-del-doc' })
  @ApiResponse({ status: 200, description: 'Documento encontrado' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado' })
  findOne(@Param('id') id: string) {
    return this.documentosService.findOne(id);
  }

  // 📄 Actualizar documento
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un documento y registrar historial' })
  @ApiParam({ name: 'id', description: 'ID del documento a actualizar' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', example: 'Informe Técnico Modificado' },
        tipo: { type: 'string', example: 'PLANTILLA' },
        ruta_archivo: { type: 'string', example: 'uploads/doc_mod.docx' },
        modulo_id: { type: 'string', format: 'uuid', nullable: true },
        subido_por: { type: 'string', format: 'uuid', nullable: true },
        anexos: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          nullable: true,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Documento actualizado correctamente' })
  update(@Param('id') id: string, @Body() dto: UpdateDocumentoDto) {
    return this.documentosService.update(id, dto);
  }

  // 📄 Eliminar documento
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un documento y registrar historial' })
  @ApiParam({ name: 'id', description: 'ID del documento a eliminar' })
  @ApiResponse({ status: 200, description: 'Documento eliminado correctamente' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado' })
  remove(@Param('id') id: string) {
    return this.documentosService.remove(id);
  }

  // 📝 Crear documento Word desde plantilla dinámica
  @Post('word/create')
  @ApiOperation({ summary: 'Crear un documento Word como plantilla dinámica' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        titulo: { type: 'string', example: 'Informe Técnico' },
        encabezado: { type: 'string', example: 'Confidencial - Área Técnica' },
        capitulos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              titulo: { type: 'string', example: 'Introducción' },
              contenido: { type: 'string', example: 'Texto del capítulo...' },
              placeholders: {
                type: 'array',
                items: { type: 'string' },
                example: ['{nombre}', '{fecha}'],
              },
            },
          },
        },
        moduloId: { type: 'string', format: 'uuid', nullable: true },
        expedienteId: { type: 'string', format: 'uuid', nullable: true },
      },
    },
  })
  async crearWord(@Body() body: {
    titulo: string;
    encabezado?: string;
    indice?: string[];
    capitulos?: { titulo: string; contenido?: string; placeholders?: string[] }[];
    moduloId?: string;
    expedienteId?: string;
  }) {
    return this.documentosService.crearDocumentoWord(body);
  }

  // 📝 Editar documento Word existente
  @Post('word/edit/:id')
  @ApiOperation({ summary: 'Editar contenido y capítulos de un documento Word' })
  @ApiParam({ name: 'id', description: 'ID del documento Word', example: 'uuid-del-doc' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contenido: { type: 'string', example: 'Nuevo contenido del documento...' },
        capitulos: { type: 'array', items: { type: 'string' }, example: ['Capítulo 1', 'Capítulo 2'] },
      },
    },
  })
  async editarWord(@Param('id') id: string, @Body() body: { contenido: string; capitulos?: string[] }) {
    return this.documentosService.editarDocumentoWord(id, body);
  }

  // 🧾 Crear PDF desde contenido
  @Post('pdf/create')
  @ApiOperation({ summary: 'Crear documento PDF desde capítulos y título' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        titulo: { type: 'string', example: 'Reporte de Resultados' },
        capitulos: { type: 'array', items: { type: 'string' }, example: ['Resumen', 'Resultados'] },
        moduloId: { type: 'string', format: 'uuid', nullable: true },
        expedienteId: { type: 'string', format: 'uuid', nullable: true },
      },
    },
  })
  async crearPDF(@Body() body: { titulo: string; capitulos: string[]; moduloId?: string; expedienteId?: string }) {
    return this.documentosService.crearDocumentoPDF(body);
  }

  // 🧾 Editar PDF existente
  @Post('pdf/edit/:id')
  @ApiOperation({ summary: 'Editar contenido y capítulos de un documento PDF' })
  @ApiParam({ name: 'id', description: 'ID del documento PDF', example: 'uuid-del-doc' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contenido: { type: 'string', example: 'Contenido actualizado del PDF...' },
        capitulos: { type: 'array', items: { type: 'string' }, example: ['Capítulo 1', 'Capítulo 2'] },
      },
    },
  })
  async editarPDF(@Param('id') id: string, @Body() body: { contenido: string; capitulos?: string[] }) {
    return this.documentosService.editarDocumentoPDF(id, body);
  }

  // 📎 Crear plantilla desde archivo subido
  @Post('plantilla/crear-desde-documento')
  @ApiOperation({ summary: 'Crear plantilla desde archivo Word o PDF subido' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Archivo a subir' },
        moduloId: { type: 'string', format: 'uuid', nullable: true },
        expedienteId: { type: 'string', format: 'uuid', nullable: true },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async crearPlantillaDesdeDocumento(@UploadedFile() file: any, @Body() body: { moduloId?: string; expedienteId?: string }) {
    return this.documentosService.crearPlantillaDesdeDocumento(file, body);
  }
}
