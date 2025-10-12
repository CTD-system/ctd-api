import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expediente, ExpedienteEstado } from './entities/expediente.entity';
import { CreateExpedienteDto } from './dto/create-expediente.dto';
import { UpdateExpedienteDto } from './dto/update-expediente.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ExpedientesService {
  constructor(
    @InjectRepository(Expediente)
    private readonly expedienteRepo: Repository<Expediente>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // Crear expediente
  async create(createDto: CreateExpedienteDto) {
    const { codigo, nombre, descripcion, estado, creado_por } = createDto;

    // Validar código único
    const existing = await this.expedienteRepo.findOne({ where: { codigo } });
    if (existing) {
      throw new BadRequestException(`El expediente con código "${codigo}" ya existe.`);
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

    return await this.expedienteRepo.save(expediente);
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

    return await this.expedienteRepo.save(expediente);
  }

  // Eliminar expediente
  async remove(id: string) {
    const expediente = await this.expedienteRepo.findOne({ where: { id } });
    if (!expediente) {
      throw new NotFoundException('Expediente no encontrado');
    }

    await this.expedienteRepo.remove(expediente);
    return { message: `Expediente ${expediente.nombre} eliminado correctamente.` };
  }
}
