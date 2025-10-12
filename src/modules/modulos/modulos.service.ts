import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Modulo, ModuloEstado } from './entities/modulo.entity';
import { Expediente } from '../expedientes/entities/expediente.entity';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';

@Injectable()
export class ModulosService {
  constructor(
    @InjectRepository(Modulo)
    private readonly moduloRepo: Repository<Modulo>,

    @InjectRepository(Expediente)
    private readonly expedienteRepo: Repository<Expediente>,
  ) {}

  // Crear módulo
  async create(createDto: CreateModuloDto) {
    const { expediente_id, numero, titulo, descripcion, estado } = createDto;

    const expediente = await this.expedienteRepo.findOne({ where: { id: expediente_id } });
    if (!expediente) throw new NotFoundException('Expediente asociado no encontrado.');

    // Verificar que no se repita el número dentro del expediente
    const existeNumero = await this.moduloRepo.findOne({
      where: { expediente: { id: expediente_id }, numero },
    });
    if (existeNumero) {
      throw new BadRequestException(`El módulo ${numero} ya existe en este expediente.`);
    }

    const modulo = this.moduloRepo.create({
      expediente,
      numero,
      titulo: titulo || `Módulo ${numero}`,
      descripcion: descripcion || '',
      estado: (estado as ModuloEstado) || ModuloEstado.BORRADOR,
    });

    return await this.moduloRepo.save(modulo);
  }

  // Listar todos los módulos
  async findAll() {
    return await this.moduloRepo.find({
      relations: ['expediente', 'documentos'],
      order: { numero: 'ASC' },
    });
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

    return await this.moduloRepo.save(modulo);
  }

  // Eliminar un módulo
  async remove(id: string) {
    const modulo = await this.moduloRepo.findOne({ where: { id } });
    if (!modulo) throw new NotFoundException('Módulo no encontrado.');

    await this.moduloRepo.remove(modulo);
    return { message: `Módulo ${modulo.titulo} eliminado correctamente.` };
  }
}
