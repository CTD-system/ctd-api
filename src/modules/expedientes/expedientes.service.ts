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

@Injectable()
export class ExpedientesService {
  constructor(
    @InjectRepository(Expediente)
    private readonly expedienteRepo: Repository<Expediente>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Modulo)
    private readonly moduloRepo: Repository<Modulo>,

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
      `expedientes/${codigo}`,
    );
    return saved;
  }

  // Obtener todos los expedientes
  async findAll() {
    return this.expedienteRepo.find({
      relations: ['creado_por', 'modulos'],
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
    const expediente = await this.expedienteRepo.findOne({
      where: { id: expedienteId },
      relations: ['modulos'],
    });
    if (!expediente) throw new Error('Expediente no encontrado');

    const modulo = await this.moduloRepo.findOne({
      where: { id: moduloId },
      relations: ['documentos'],
    });
    if (!modulo) throw new Error('Módulo no encontrado');

    // 🔹 Asignar expediente al módulo
    modulo.expediente = expediente;

    // 🔹 Construir ruta dentro del expediente
    const baseRuta = `expedientes/${expediente.codigo}`;
    modulo.ruta = `${baseRuta}/${modulo.titulo}`;

    await this.moduloRepo.save(modulo);

    // 🔹 Crear carpeta del módulo en MinIO
    await this.minioService.createFolder('ctd-expedientes', modulo.ruta);

    // 🔹 Actualizar documentos asociados con la nueva ruta del módulo
    for (const doc of modulo.documentos) {
      if (doc.ruta_archivo) {
        const fileName = path.basename(doc.ruta_archivo);
        const destinoMinio = `${modulo.ruta}/${fileName}`;
        await this.minioService.uploadFile(
          'ctd-expedientes',
          destinoMinio,
          doc.ruta_archivo,
        );
      }
    }

    return {
      message: `Módulo "${modulo.titulo}" asignado al expediente "${expediente.codigo}" correctamente.`,
    };
  }

  async eliminarEnCascada(id: string) {
    const expediente = await this.expedienteRepo.findOne({
      where: { id },
      relations: ['modulos', 'modulos.documentos'],
    });
    if (!expediente) throw new Error('Expediente no encontrado');

    await this.minioService.removeFolder(
      'ctd-expedientes',
      `expedientes/${expediente.codigo}/`,
    );

    for (const modulo of expediente.modulos) {
      for (const documento of modulo.documentos) {
        await this.documentoRepo.remove(documento);
      }
      await this.moduloRepo.remove(modulo);
    }
    await this.expedienteRepo.remove(expediente);
    return {
      message: 'Expediente y sus módulos/documentos eliminados en cascada.',
    };
  }
}
