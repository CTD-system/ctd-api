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

  async actualizarIndiceModulo(moduloId: string) {
    const modulo = await this.moduloRepo.findOne({
      where: { id: moduloId },
      relations: ['documentos', 'submodulos', 'submodulos.documentos','moduloContenedor'],
    });
    if (!modulo) throw new NotFoundException('Módulo no encontrado');

    // 1️⃣ Generar nuevo contenido de índice
    const submodulos = await this.moduloRepo.find({
      where: { moduloContenedor: { id: modulo.id } },
      relations: ['documentos','submodulos', 'submodulos.documentos','moduloContenedor'],
    });

    console.log(submodulos);
    console.log(submodulos.map((s)=> s.documentos));

    const capitulos: string[] = [];
    for (const sub of submodulos) {
      capitulos.push(`Submódulo: ${sub.titulo}`);
      for (const doc of sub.documentos) {
        capitulos.push(`- Documento: ${doc.nombre || doc.id}`);
      }
    }

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: `Índice de Módulo ${modulo.titulo}`,
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
    if (!modulo.indice_word_nombre) {
      
      modulo.indice_word_nombre = `indice_modulo_${modulo.titulo}.docx`;
    }

    
      modulo.indice_word_ruta = `${modulo.ruta}/${modulo.indice_word_nombre}`;
    

    

    // 2️⃣ Sobrescribir el archivo existente
    const filePath = path.join(
      process.cwd(),
      'uploads',
      modulo.indice_word_nombre,
    );
    fs.writeFileSync(filePath, await Packer.toBuffer(doc));

    await this.minioService.uploadFile(
      'ctd-expedientes',
      modulo.indice_word_ruta, // misma ruta en MinIO
      filePath,
    );
    console.log("Indice ACTUALIZADO");
    
    return { message: 'Índice actualizado correctamente' };
  }

  // Crear módulo
  async create(createDto: CreateModuloDto) {
    const {
      expediente_id,
      
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
      where: { expediente: { id: expediente_id }, titulo },
    });
    if (existeNumero) {
      throw new BadRequestException(
        `El módulo ${titulo} ya existe en este expediente.`,
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
     
      moduloContenedor: moduloContenedor || undefined,
      titulo: titulo,
      descripcion: descripcion || '',
      estado: (estado as ModuloEstado) || ModuloEstado.BORRADOR,
    });

    const baseRuta = `expedientes/${expediente.nombre}`;
    modulo.ruta = moduloContenedor
      ? `${moduloContenedor.ruta}/${modulo.titulo}`
      : `${baseRuta}/${modulo.titulo}`;

    await this.minioService.createFolder('ctd-expedientes', modulo.ruta);

    // Generar archivo Word de índice si se solicita
    if (crearIndiceWord) {
      // Obtener submódulos y documentos del expediente
      const submodulos = await this.moduloRepo.find({
        where: { moduloContenedor: { id: modulo.id } },
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
                text: `Índice de Módulo ${titulo}`,
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
      const fileName = `indice_modulo_${titulo}.docx`;
      const filePath = path.join(process.cwd(), 'uploads', fileName);
      if (!fs.existsSync(path.dirname(filePath)))
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(filePath, buffer);
      modulo.indice_word_nombre = fileName;
      modulo.indice_word_ruta = filePath;
      // Subir a MinIO
      try {
        await this.minioService.uploadFile(
          'ctd-expedientes',
          `${modulo.ruta}/${fileName}`,
          filePath,
        );
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
      const fileName = `referencias_modulo_${titulo}.docx`;
      const filePath = path.join(process.cwd(), 'uploads', fileName);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, await Packer.toBuffer(doc));
      modulo.referencias_word_nombre = fileName;
      modulo.referencias_word_ruta = filePath;
      // Subir a MinIO
      try {
        await this.minioService.uploadFile(
          'ctd-expedientes',
          `${modulo.ruta}/${fileName}`,
          filePath,
        );
      } catch (e) {
        // Manejar error de subida a MinIO
      }
    }
    if (modulo.moduloContenedor && modulo.moduloContenedor.indice_word_nombre) {
      console.log("Se va actualizar el indice");
      
      await this.actualizarIndiceModulo(modulo.moduloContenedor.id);
    }
    return await this.moduloRepo.save(modulo);
  }

  // Listar todos los módulos
  async findAll() {
    const modulos = await this.moduloRepo.find({
      relations: ['expediente', 'documentos','moduloContenedor'],
      order: { titulo: 'ASC' },
    });
    return { total: modulos.length, modulos };
  }

  // Obtener un módulo por ID
  async findOne(id: string) {
    const modulo = await this.moduloRepo.findOne({
      where: { id },
      relations: ['expediente', 'documentos','submodulos', 'submodulos.documentos','moduloContenedor'],
    });

    if (!modulo) throw new NotFoundException('Módulo no encontrado.');
    return modulo;
  }

  // Actualizar un módulo
  async update(id: string, updateDto: UpdateModuloDto) {
    const modulo = await this.moduloRepo.findOne({ where: { id } });
    if (!modulo) throw new NotFoundException('Módulo no encontrado.');

    Object.assign(modulo, {
      
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
  if (!modulo) throw new NotFoundException('Módulo no encontrado.');

  // Nombre seguro
  if (!modulo.referencias_word_nombre) {
    const safeTitulo = (modulo.titulo || 'modulo').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    modulo.referencias_word_nombre = `referencias_${safeTitulo}.docx`;
  }

  // RUTA MinIO segura
  if (!modulo.referencias_word_ruta) {
    // Convierte backslashes a slashes
    const safeRuta = modulo.ruta.replace(/\\/g, '/');
    modulo.referencias_word_ruta = `${safeRuta}/${modulo.referencias_word_nombre}`;
  }

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: 'Referencias bibliográficas', heading: HeadingLevel.TITLE }),
          ...referencias.map((ref) => new Paragraph({ text: ref, heading: HeadingLevel.HEADING_2 })),
        ],
      },
    ],
  });

  // Ruta local para guardar temporalmente
  const filePath = path.join(process.cwd(), 'uploads', modulo.referencias_word_nombre);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, await Packer.toBuffer(doc));

  const minioObjectName = `${modulo.ruta.replace(/\\/g, '/')}/${modulo.referencias_word_nombre}`;
await this.minioService.uploadFile(
  'ctd-expedientes',
  minioObjectName, // ✅ ruta válida para MinIO
  filePath,        // archivo local
);

  return { message: 'Referencias bibliográficas actualizadas y subidas a MinIO.' };
}

async obtenerReferenciasWord(moduloId: string): Promise<string[]> {
  const modulo = await this.moduloRepo.findOne({ where: { id: moduloId } });
  if (!modulo) throw new NotFoundException('Módulo no encontrado.');

  if (!modulo.referencias_word_nombre) return [];

  // SIEMPRE: ruta que esta en MinIO = carpeta módulo + nombre archivo
  const objectName = `${modulo.ruta}/${modulo.referencias_word_nombre}`.replace(/\\/g, '/');

  const tempPath = path.join(process.cwd(), 'temp', `${modulo.id}_ref.docx`);
  fs.mkdirSync(path.dirname(tempPath), { recursive: true });

  // descargar desde minio
  await this.minioService.downloadFile(
    'ctd-expedientes',
    objectName,
    tempPath,
  );

  // leer docx
  const buffer = fs.readFileSync(tempPath);
  const mammoth = require("mammoth");
  const result = await mammoth.extractRawText({ buffer });

  const lineas = result.value
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0 && l !== "Referencias bibliográficas");

  return lineas;
}



  // Eliminar un módulo
  // Eliminar un módulo y todos sus submódulos recursivamente
async remove(id: string) {
  const modulo = await this.moduloRepo.findOne({
    where: { id },
    relations: ['submodulos','documentos'],
  });
  if (!modulo) throw new NotFoundException('Módulo no encontrado.');

  

  // Función recursiva para eliminar submódulos
  const eliminarModuloRecursivo = async (mod: Modulo) => {
    if (mod.documentos && mod.documentos.length > 0) {
  for (const doc of mod.documentos) {

    // borrar archivo del documento en Minio
    try {
      if (doc.ruta_archivo) {
        await this.minioService.removeObject('ctd-expedientes', doc.ruta_archivo);
      }
    } catch (e) {
      console.error('error borrando archivo de documento', e);
    }

    // borrar doc en BD
    await this.documentoRepo.remove(doc);
  }
}
    // Segundo eliminamos submódulos
    if (mod.submodulos && mod.submodulos.length > 0) {
      for (const sub of mod.submodulos) {
        // Cargar sub-submodulos
        const subModulo = await this.moduloRepo.findOne({
          where: { id: sub.id },
          relations: ['submodulos'],
        });
        if (subModulo) {
          await eliminarModuloRecursivo(subModulo);
        }
      }
    }

    // Eliminar carpeta en MinIO
    try {
      
      if (mod.ruta) {
        await this.minioService.removeFolder('ctd-expedientes', mod.ruta);
      }
    } catch (e) {
      console.error('Error eliminando archivos del módulo en MinIO:', e);
    }

    // Eliminar módulo de la BD
    await this.moduloRepo.remove(mod);
    console.log(`Módulo "${mod.titulo}" eliminado.`);
  };

  await eliminarModuloRecursivo(modulo);

  return { message: `Módulo "${modulo.titulo}" y todos sus submódulos eliminados correctamente.` };
}


  // Asignar documento a módulo
  async asignarDocumento(moduloId: string, documentoId: string) {
    // 🔹 1. Buscar módulo con sus documentos
    const modulo = await this.moduloRepo.findOne({
      where: { id: moduloId },
      relations: ['expediente', 'documentos','submodulos', 'submodulos.documentos','moduloContenedor'],
    });
    if (!modulo) throw new NotFoundException('Módulo no encontrado.');

    // 🔹 2. Buscar documento
    const documento = await this.documentoRepo.findOne({
      where: { id: documentoId },
    });
    if (!documento) throw new NotFoundException('Documento no encontrado.');

    // 🔹 3. Verificar que el documento tenga una ruta y nombre de archivo
    if (!documento.nombre || !documento.ruta_archivo) {
      throw new BadRequestException(
        'El documento no tiene archivo asociado en MinIO.',
      );
    }

    // 🔹 4. Construir nuevas rutas en MinIO dentro del módulo
    const bucket = 'ctd-expedientes';
    const nombreArchivo = documento.nombre;
    const nuevaRuta = `${modulo.ruta}/${nombreArchivo}`.replace(/\\/g, '/');

    const rutaOrigen = documento.ruta_archivo;

    console.log(rutaOrigen);

    try {
      // === MOVER ARCHIVO EN MINIO ===
      // Descargar el archivo temporalmente
      const tempDir = path.join(process.cwd(), 'temp');
      fs.mkdirSync(tempDir, { recursive: true });
      const tempPath = path.join(tempDir, nombreArchivo);

      await this.minioService.downloadFile(bucket, rutaOrigen, tempPath);

      // Subirlo a la nueva ruta (dentro del módulo)
      await this.minioService.uploadFile(bucket, nuevaRuta, tempPath);

      // Eliminar la copia anterior
      await this.minioService.removeObject(bucket, rutaOrigen);

      // Eliminar el archivo temporal local
      fs.unlinkSync(tempPath);

      // 🔹 5. Actualizar los campos en la BD
      documento.ruta_archivo = nuevaRuta;
      documento.modulo = modulo;

      await this.documentoRepo.save(documento);

      if (modulo.moduloContenedor && modulo.moduloContenedor.indice_word_nombre) {
        console.log('Actualizando Indice del modulo contenedor');
        
        await this.actualizarIndiceModulo(modulo.moduloContenedor.id);
      }

      return {
        message: `📂 Documento "${nombreArchivo}" movido y asignado al módulo "${modulo.titulo}" correctamente.`,
        nuevaRuta,
      };
    } catch (error) {
      console.error('❌ Error al mover el documento en MinIO:', error);
      throw new BadRequestException(
        'Error al mover el documento dentro del módulo en MinIO.',
      );
    }
  }
}
