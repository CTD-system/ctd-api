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
  UnauthorizedException,
  UseGuards,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@ApiTags('Documentos')
@ApiBearerAuth()
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generar-plantilla/:documentoId')
  @ApiOperation({
    summary:
      'Generar una plantilla en base a un documento existente descargado desde MinIO',
  })
  @ApiParam({
    name: 'documentoId',
    description: 'ID del documento en la base de datos',
    example: 'uuid-del-documento',
  })
  @ApiResponse({
    status: 201,
    description:
      'Plantilla generada correctamente desde el documento especificado',
  })
  async generarPlantillaDesdeDocumento(
    @Param('documentoId') documentoId: string,
  ) {
    return this.documentosService.generarPlantillaDesdeDocumento(documentoId);
  }

  // 📄 Crear documento Word desde plantilla existente
  @UseGuards(JwtAuthGuard)
  @Post('word/from-plantilla/:plantillaId')
  @ApiOperation({
    summary: 'Crear un documento Word a partir de una plantilla seleccionada',
  })
  @ApiParam({
    name: 'plantillaId',
    description: 'ID de la plantilla',
    example: 'uuid-de-la-plantilla',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', example: 'Informe Técnico Generado' },

        modulo_id: { type: 'string', format: 'uuid', nullable: true },

        anexos: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          nullable: true,
        },
      },
    },
  })
  async crearDesdePlantilla(
    @Param('plantillaId') plantillaId: string,
    @Body() body: CreateDocumentoDto,
    @CurrentUser() user: User,
  ) {
     if (!user || !user.id) {
    throw new UnauthorizedException('Usuario no autenticado');
  }
    // Mapear plantillaId al DTO
    const createDto: CreateDocumentoDto & { plantilla_id: string; subido_por: string } = {
    ...body,
    plantilla_id: plantillaId,
    subido_por: user.id,   // ✅ Pasamos el user.id al servicio
  };

    return this.documentosService.createFromPlantilla(createDto);
  }

  // 📄 Listar documentos
  @Get()
  @ApiOperation({ summary: 'Listar todos los documentos con módulo y usuario' })
  @ApiResponse({
    status: 200,
    description: 'Documentos listados correctamente',
  })
  findAll() {
    return this.documentosService.findAll();
  }

  // 📄 Obtener documento por ID
  @Get(':id')
  @ApiOperation({ summary: 'Obtener documento por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del documento',
    example: 'uuid-del-doc',
  })
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
  @ApiResponse({
    status: 200,
    description: 'Documento actualizado correctamente',
  })
  update(@Param('id') id: string, @Body() dto: Partial<UpdateDocumentoDto>) {
    return this.documentosService.patch(id, dto);
  }

  // 📄 Eliminar documento
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un documento y registrar historial' })
  @ApiParam({ name: 'id', description: 'ID del documento a eliminar' })
  @ApiResponse({
    status: 200,
    description: 'Documento eliminado correctamente',
  })
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
  async crearWord(
    @Body()
    body: {
      titulo: string;
      encabezado?: string;
      indice?: string[];
      capitulos?: {
        titulo: string;
        contenido?: string;
        placeholders?: string[];
      }[];
      moduloId?: string;
      expedienteId?: string;
    },
  ) {
    return this.documentosService.crearDocumentoWord(body);
  }

  // 📝 Editar documento Word existente
  @Post('word/edit/:id')
  @ApiOperation({
    summary: 'Editar contenido y capítulos de un documento Word',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del documento Word',
    example: 'uuid-del-doc',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contenido: {
          type: 'string',
          example: 'Nuevo contenido del documento...',
        },
        capitulos: {
          type: 'array',
          items: { type: 'string' },
          example: ['Capítulo 1', 'Capítulo 2'],
        },
      },
    },
  })
  async editarWord(
    @Param('id') id: string,
    @Body() body: { contenido: string; capitulos?: string[] },
  ) {
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
        capitulos: {
          type: 'array',
          items: { type: 'string' },
          example: ['Resumen', 'Resultados'],
        },
        moduloId: { type: 'string', format: 'uuid', nullable: true },
        expedienteId: { type: 'string', format: 'uuid', nullable: true },
      },
    },
  })
  async crearPDF(
    @Body()
    body: {
      titulo: string;
      capitulos: string[];
      moduloId?: string;
      expedienteId?: string;
    },
  ) {
    return this.documentosService.crearDocumentoPDF(body);
  }

  // 🧾 Editar PDF existente
  @Post('pdf/edit/:id')
  @ApiOperation({ summary: 'Editar contenido y capítulos de un documento PDF' })
  @ApiParam({
    name: 'id',
    description: 'ID del documento PDF',
    example: 'uuid-del-doc',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contenido: {
          type: 'string',
          example: 'Contenido actualizado del PDF...',
        },
        capitulos: {
          type: 'array',
          items: { type: 'string' },
          example: ['Capítulo 1', 'Capítulo 2'],
        },
      },
    },
  })
  async editarPDF(
    @Param('id') id: string,
    @Body() body: { contenido: string; capitulos?: string[] },
  ) {
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
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo a subir',
        },
        moduloId: { type: 'string', format: 'uuid', nullable: true },
        expedienteId: { type: 'string', format: 'uuid', nullable: true },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async crearPlantillaDesdeDocumento(
    @UploadedFile() file: any,
    @Body() body: { moduloId?: string; expedienteId?: string },
  ) {
    return this.documentosService.crearPlantillaDesdeDocumento(file, body);
  }
}
