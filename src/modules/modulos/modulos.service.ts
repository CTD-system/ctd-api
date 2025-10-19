import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Modulo, ModuloEstado } from './entities/modulo.entity';
import { Expediente } from '../expedientes/entities/expediente.entity';
import { Documento } from '../documentos/entities/documento.entity';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { MinioService } from '../minio.service';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ModulosService {
  constructor(
    @InjectRepository(Modulo)
    private readonly moduloRepo: Repository<Modulo>,

    @InjectRepository(Expediente)
    private readonly expedienteRepo: Repository<Expediente>,

    @InjectRepository(Documento)
    private readonly documentoRepo: Repository<Documento>,
    private readonly minioService: MinioService,
  ) {}

  // Crear módulo
  async create(createDto: CreateModuloDto) {
    const {
      expediente_id,
      numero,
      titulo,
      descripcion,
      estado,
      crearIndiceWord,
      crearReferenciasWord,
      modulo_contenedor_id,
    } = createDto;

    const expediente = await this.expedienteRepo.findOne({
      where: { id: expediente_id },
    });
    if (!expediente)
      throw new NotFoundException('Expediente asociado no encontrado.');

    // Verificar que no se repita el número dentro del expediente
    const existeNumero = await this.moduloRepo.findOne({
      where: { expediente: { id: expediente_id }, numero },
    });
    if (existeNumero) {
      throw new BadRequestException(
        `El módulo ${numero} ya existe en este expediente.`,
      );
    }

    let moduloContenedor: Modulo | null = null;
    if (modulo_contenedor_id) {
      moduloContenedor = await this.moduloRepo.findOne({
        where: { id: modulo_contenedor_id },
      });
      if (!moduloContenedor) {
        throw new NotFoundException('Módulo contenedor no encontrado.');
      }
    }

    const modulo = this.moduloRepo.create({
      expediente,
      numero,
      moduloContenedor: moduloContenedor || undefined,
      titulo: titulo || `Módulo ${numero}`,
      descripcion: descripcion || '',
      estado: (estado as ModuloEstado) || ModuloEstado.BORRADOR,
    });

    const baseRuta = `expedientes/${expediente.codigo}`;
    modulo.ruta = moduloContenedor
      ? `${moduloContenedor.ruta}/${modulo.titulo}`
      : `${baseRuta}/${modulo.titulo}`;

    await this.minioService.createFolder('ctd-expedientes', modulo.ruta);

    // Generar archivo Word de índice si se solicita
    if (crearIndiceWord) {
      // Obtener submódulos y documentos del expediente
      const submodulos = await this.moduloRepo.find({
        where: { expediente: { id: expediente_id } },
        relations: ['documentos'],
      });
      let capitulos: string[] = [];
      for (const sub of submodulos) {
        capitulos.push(`Submódulo: ${sub.titulo}`);
        if (sub.documentos) {
          for (const doc of sub.documentos) {
            capitulos.push(`- Documento: ${doc.nombre || doc.id}`);
          }
        }
      }
      // Crear documento Word
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: `Índice de Módulo ${numero}`,
                heading: HeadingLevel.TITLE,
              }),
              ...capitulos.map(
                (c) =>
                  new Paragraph({ text: c, heading: HeadingLevel.HEADING_2 }),
              ),
            ],
          },
        ],
      });
      const fileName = `indice_modulo_${numero}.docx`;
      const filePath = path.join(process.cwd(), 'uploads', fileName);
      if (!fs.existsSync(path.dirname(filePath)))
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(filePath, buffer);
      modulo.indice_word_nombre = fileName;
      modulo.indice_word_ruta = filePath;
      // Subir a MinIO
      try {
        await this.minioService.uploadFile('ctd-modulos', fileName, filePath);
      } catch (e) {
        // Manejar error de subida a MinIO
      }
    }

    // Generar archivo Word de referencias bibliográficas si se solicita
    if (crearReferenciasWord) {
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: `Referencias bibliográficas`,
                heading: HeadingLevel.TITLE,
              }),
            ],
          },
        ],
      });
      const fileName = `referencias_modulo_${numero}.docx`;
      const filePath = path.join(process.cwd(), 'uploads', fileName);
      if (!fs.existsSync(path.dirname(filePath)))
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(filePath, buffer);
      modulo.referencias_word_nombre = fileName;
      modulo.referencias_word_ruta = filePath;
      // Subir a MinIO
      try {
        await this.minioService.uploadFile('ctd-modulos', fileName, filePath);
      } catch (e) {
        // Manejar error de subida a MinIO
      }
    }

    const saved = await this.moduloRepo.save(modulo);
    return saved;
  }

  // Listar todos los módulos
  async findAll() {
    const modulos = await this.moduloRepo.find({
      relations: ['expediente', 'documentos'],
      order: { numero: 'ASC' },
    });
    return { total: modulos.length, modulos };
  }

  // Obtener un módulo por ID
  async findOne(id: string) {
    const modulo = await this.moduloRepo.findOne({
      where: { id },
      relations: ['expediente', 'documentos'],
    });

    if (!modulo) throw new NotFoundException('Módulo no encontrado.');
    return modulo;
  }

  // Actualizar un módulo
  async update(id: string, updateDto: UpdateModuloDto) {
    const modulo = await this.moduloRepo.findOne({ where: { id } });
    if (!modulo) throw new NotFoundException('Módulo no encontrado.');

    Object.assign(modulo, {
      numero: updateDto.numero ?? modulo.numero,
      titulo: updateDto.titulo ?? modulo.titulo,
      descripcion: updateDto.descripcion ?? modulo.descripcion,
      estado: (updateDto.estado as ModuloEstado) ?? modulo.estado,
    });

    const updated = await this.moduloRepo.save(modulo);
    // Subir archivo actualizado a MinIO si hay ruta y nombre de archivo
    if ((updated as any).archivo_ruta && (updated as any).archivo_nombre) {
      try {
        await this.minioService.uploadFile(
          'ctd-modulos',
          (updated as any).archivo_nombre,
          (updated as any).archivo_ruta,
        );
      } catch (e) {
        // Manejar error de subida a MinIO
      }
    }
    return { message: 'Módulo actualizado correctamente.', updated };
  }

  // Editar el archivo Word de referencias bibliográficas de un módulo
  async editarReferenciasWord(moduloId: string, referencias: string[]) {
    const modulo = await this.moduloRepo.findOne({ where: { id: moduloId } });
    if (!modulo || !modulo.referencias_word_ruta)
      throw new NotFoundException(
        'Módulo o archivo de referencias no encontrado',
      );
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: `Referencias bibliográficas`,
              heading: HeadingLevel.TITLE,
            }),
            ...referencias.map(
              (ref) =>
                new Paragraph({ text: ref, heading: HeadingLevel.HEADING_2 }),
            ),
          ],
        },
      ],
    });
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(modulo.referencias_word_ruta, buffer);
    if (modulo.referencias_word_nombre && modulo.referencias_word_ruta) {
      await this.minioService.uploadFile(
        'ctd-modulos',
        modulo.referencias_word_nombre,
        modulo.referencias_word_ruta,
      );
    } else {
      throw new Error('Nombre o ruta del archivo de referencias no definido.');
    }
    return {
      message: 'Referencias bibliográficas actualizadas y subidas a MinIO.',
    };
  }
  // Eliminar un módulo
  async remove(id: string) {
    const modulo = await this.moduloRepo.findOne({ where: { id } });
    if (!modulo) throw new NotFoundException('Módulo no encontrado.');

    // Eliminar archivo de MinIO si existe
    if ((modulo as any).archivo_nombre) {
      try {
        await this.minioService.removeObject(
          'ctd-modulos',
          (modulo as any).archivo_nombre,
        );
      } catch (e) {
        // Manejar error de borrado en MinIO
      }
    }
    await this.moduloRepo.remove(modulo);
    return { message: `Módulo ${modulo.titulo} eliminado correctamente.` };
  }

  // Asignar documento a módulo
  async asignarDocumento(moduloId: string, documentoId: string) {
    const modulo = await this.moduloRepo.findOne({
      where: { id: moduloId },
      relations: ['documentos'],
    });
    if (!modulo) throw new Error('Módulo no encontrado');
    const documento = await this.documentoRepo.findOne({
      where: { id: documentoId },
    });
    if (!documento) throw new Error('Documento no encontrado');
    documento.modulo = modulo;
    await this.documentoRepo.save(documento);
    return {
      message: `Documento asignado al módulo "${modulo.titulo}" correctamente.`,
    };
  }
}
