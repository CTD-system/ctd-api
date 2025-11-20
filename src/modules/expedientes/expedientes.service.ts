import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expediente, ExpedienteEstado } from './entities/expediente.entity';
import { CreateExpedienteDto } from './dto/create-expediente.dto';
import { UpdateExpedienteDto } from './dto/update-expediente.dto';
import { User } from '../users/entities/user.entity';
import { Modulo } from '../modulos/entities/modulo.entity';
import { Documento } from '../documentos/entities/documento.entity';
import { MinioService } from '../minio.service';
import path from 'path';
import * as fs from 'fs';
import { HistorialDocumento } from '../historial/entities/historial_documento.entity';
@Injectable()
export class ExpedientesService {
  constructor(
    @InjectRepository(Expediente)
    private readonly expedienteRepo: Repository<Expediente>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Modulo)
    private readonly moduloRepo: Repository<Modulo>,

    @InjectRepository(HistorialDocumento)
     private readonly historialDocumentoRepo: Repository<HistorialDocumento>,
    @InjectRepository(Documento)
    private readonly documentoRepo: Repository<Documento>,
    private readonly minioService: MinioService,
  ) {
    this.minioService.ensureBucket('ctd-expedientes');
  }

  // Crear expediente
  async create(createDto: CreateExpedienteDto) {
    const { codigo, nombre, descripcion, estado, creado_por } = createDto;

    // Validar código único
    const existing = await this.expedienteRepo.findOne({ where: { codigo } });
    if (existing) {
      throw new BadRequestException(
        `El expediente con código "${codigo}" ya existe.`,
      );
    }

    let user: User | null = null;
    if (creado_por) {
      user = await this.userRepo.findOne({ where: { id: creado_por } });
      if (!user) throw new NotFoundException('Usuario creador no encontrado.');
    }

    const expediente = this.expedienteRepo.create({
      codigo,
      nombre,
      descripcion: descripcion || '',
      estado: (estado as ExpedienteEstado) || ExpedienteEstado.BORRADOR,
      creado_por: user || undefined,
    });

    const saved = await this.expedienteRepo.save(expediente);
    // Subir archivo a MinIO si hay ruta y nombre de archivo
    if ((saved as any).archivo_ruta && (saved as any).archivo_nombre) {
      try {
        await this.minioService.uploadFile(
          'ctd-expedientes',
          (saved as any).archivo_nombre,
          (saved as any).archivo_ruta,
        );
      } catch (e) {
        // Manejar error de subida a MinIO
      }
    }
    await this.minioService.createFolder(
      'ctd-expedientes',
      `expedientes/${nombre}`,
    );
    return saved;
  }

  // Obtener todos los expedientes
  async findAll() {
    return this.expedienteRepo.find({
      relations: ['creado_por', 'modulos','modulos.moduloContenedor'],
      order: { creado_en: 'DESC' },
    });
  }

  // Obtener expediente por ID
  async findOne(id: string) {
    const expediente = await this.expedienteRepo.findOne({
      where: { id },
      relations: ['creado_por', 'modulos'],
    });

    if (!expediente) {
      throw new NotFoundException('Expediente no encontrado');
    }

    return expediente;
  }

  // Actualizar expediente
  async update(id: string, updateDto: UpdateExpedienteDto) {
    const expediente = await this.expedienteRepo.findOne({ where: { id } });
    if (!expediente) {
      throw new NotFoundException('Expediente no encontrado');
    }

    Object.assign(expediente, {
      nombre: updateDto.nombre ?? expediente.nombre,
      descripcion: updateDto.descripcion ?? expediente.descripcion,
      estado: (updateDto.estado as ExpedienteEstado) ?? expediente.estado,
    });

    const updated = await this.expedienteRepo.save(expediente);
    // Subir archivo actualizado a MinIO si hay ruta y nombre de archivo
    if ((updated as any).archivo_ruta && (updated as any).archivo_nombre) {
      try {
        await this.minioService.uploadFile(
          'ctd-expedientes',
          (updated as any).archivo_nombre,
          (updated as any).archivo_ruta,
        );
      } catch (e) {
        // Manejar error de subida a MinIO
      }
    }
    return updated;
  }

  // Eliminar expediente
  async remove(id: string) {
    const expediente = await this.expedienteRepo.findOne({ where: { id } });
    if (!expediente) {
      throw new NotFoundException('Expediente no encontrado');
    }

    // Eliminar archivo de MinIO si existe
    if ((expediente as any).archivo_nombre) {
      try {
        await this.minioService.removeObject(
          'ctd-expedientes',
          (expediente as any).archivo_nombre,
        );
      } catch (e) {
        // Manejar error de borrado en MinIO
      }
    }
    await this.expedienteRepo.remove(expediente);
    return {
      message: `Expediente ${expediente.nombre} eliminado correctamente.`,
    };
  }



async asignarModulo(expedienteId: string, moduloId: string) {
  const bucket = 'ctd-expedientes';

  // 🔹 1. Buscar expediente destino
  const expediente = await this.expedienteRepo.findOne({
    where: { id: expedienteId },
    relations: ['modulos'],
  });
  if (!expediente) throw new NotFoundException('Expediente no encontrado.');

  // 🔹 2. Buscar módulo origen con todas sus relaciones
  const modulo = await this.moduloRepo.findOne({
    where: { id: moduloId },
    relations: [
      'expediente',
      'documentos',
      'submodulos',
      'submodulos.documentos',
      'moduloContenedor',
    ],
  });
  if (!modulo) throw new NotFoundException('Módulo no encontrado.');

  // 🔹 3. Obtener la ruta origen real (desde expediente actual del módulo)
  const expedienteActual = modulo.expediente;
  const rutaOrigen = expedienteActual 
    ? `expedientes/${expedienteActual.nombre}/${modulo.titulo}`
    : modulo.titulo;
  const nuevaRuta = `expedientes/${expediente.nombre}/${modulo.titulo}`.replace(/\\/g, '/');

  // 🔹 4. Mover archivos dentro del bucket
  try {
    const objetos = await this.minioService.listFilesByPrefix(bucket, rutaOrigen + '/');
    
    for (const oldPath of objetos) {
      const relative = oldPath.replace(rutaOrigen + '/', '');
      const newPath = `${nuevaRuta}/${relative}`;

      // Usar copyObject a través de minioService si está disponible
      try {
        await this.minioService['minioClient'].copyObject(
          bucket,
          newPath,
          `/${bucket}/${oldPath}`,
        );
        await this.minioService.removeObject(bucket, oldPath);
      } catch (err) {
        console.warn(`⚠️ Error moviendo ${oldPath}:`, err?.message);
      }
    }
  } catch (err) {
    console.warn('⚠️ Error listando archivos origen:', err?.message);
  }

  // 🔹 5. Actualizar recursivamente módulos y documentos
  const actualizarModuloRecursivo = async (mod: Modulo, parentRuta: string) => {
    mod.expediente = expediente;
    mod.ruta = `${parentRuta}/${mod.titulo}`.replace(/\\/g, '/');
    await this.moduloRepo.save(mod);

    // Actualizar documentos del módulo actual
    for (const doc of mod.documentos ?? []) {
      const fileName = path.basename(doc.ruta_archivo);
      doc.ruta_archivo = `${mod.ruta}/${fileName}`;
      await this.documentoRepo.save(doc);
    }

    // Procesar submódulos recursivamente
    const submodulos = await this.moduloRepo.find({
      where: { moduloContenedor: { id: mod.id } },
      relations: ['documentos'],
    });

    for (const sub of submodulos) {
      await actualizarModuloRecursivo(sub, mod.ruta);
    }
  };

  await actualizarModuloRecursivo(modulo, `expedientes/${expediente.nombre}`);

  // 🔹 6. Crear la nueva carpeta en MinIO
  await this.minioService.createFolder(bucket, nuevaRuta);

  // 🔹 7. Eliminar la carpeta original vacía
  try {
    await this.minioService.removeFolder(bucket, rutaOrigen + '/');
  } catch (err) {
    console.warn('⚠️ No se pudo eliminar carpeta origen:', err?.message || err);
  }

  return {
    message: `📦 Módulo "${modulo.titulo}" movido y asignado al expediente "${expediente.nombre}" correctamente.`,
    nuevaRuta,
  };
}




  async eliminarEnCascada(id: string) {
  const expediente = await this.expedienteRepo.findOne({
    where: { id },
    relations: [
      'modulos',
      'modulos.submodulos',
      'modulos.submodulos.documentos',
      'modulos.documentos',
    ],
  });

  if (!expediente) throw new Error('Expediente no encontrado');

  // 🧹 1. Eliminar carpeta completa en MinIO
  await this.minioService.removeFolder(
    'ctd-expedientes',
    `expedientes/${expediente.codigo}/`,
  );

  // 🧩 2. Función recursiva para eliminar módulos y submódulos
  const eliminarModuloRecursivo = async (modulo: Modulo) => {
  // 🔍 Re-cargar el módulo con todos sus submódulos y documentos
  const moduloCompleto = await this.moduloRepo.findOne({
    where: { id: modulo.id },
    relations: ['submodulos', 'documentos'],
  });

  if (!moduloCompleto) return;

  // 🧩 Eliminar recursivamente submódulos
  if (moduloCompleto.submodulos && moduloCompleto.submodulos.length > 0) {
    for (const sub of moduloCompleto.submodulos) {
      await eliminarModuloRecursivo(sub);
    }
  }

  // 🗎 Eliminar documentos asociados
  if (moduloCompleto.documentos && moduloCompleto.documentos.length > 0) {
    for (const documento of moduloCompleto.documentos) {
      try {
        await this.minioService.removeObject('ctd-expedientes', documento.ruta_archivo);
      } catch {}
      // Eliminar historial del documento
await this.historialDocumentoRepo.delete({ documento: { id: documento.id } });
      await this.documentoRepo.remove(documento);
    }
  }

  // 🧹 Finalmente eliminar el módulo actual
  await this.moduloRepo.remove(moduloCompleto);
};


  // 🧱 3. Eliminar todos los módulos raíz del expediente
  for (const modulo of expediente.modulos) {
    await eliminarModuloRecursivo(modulo);
  }

  // 🗑️ 4. Eliminar el expediente en sí
  await this.expedienteRepo.remove(expediente);

  return {
    message: 'Expediente, módulos y documentos eliminados en cascada correctamente.',
  };
}


}
