import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePlantillaDto } from './dto/create-plantilla.dto';
import { UpdatePlantillaDto } from './dto/update-plantilla.dto';
import { Plantilla } from './entities/plantilla.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PlantillasService {
  constructor(
    @InjectRepository(Plantilla)
    private readonly plantillaRepo: Repository<Plantilla>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Crea una nueva plantilla de documento Word
   */
  async create(createPlantillaDto: CreatePlantillaDto) {
    try {
      const {
        creado_por,
        nombre,
        descripcion,
        tipo_archivo,
        ruta_archivo,
        ...configuracionWord
      } = createPlantillaDto;

      let creador: User | undefined|null = undefined;
      if (creado_por) {
        creador = await this.userRepo.findOne({ where: { id: creado_por } });
        if (!creador)
          throw new NotFoundException(`Usuario con id ${creado_por} no existe`);
      }

      const plantilla = this.plantillaRepo.create({
        nombre,
        descripcion,
        tipo_archivo,
        ruta_archivo,
        creado_por: creador,
        ...configuracionWord,
      });

      return await this.plantillaRepo.save(plantilla);
    } catch (error) {
      throw new BadRequestException(`Error al crear plantilla: ${error.message}`);
    }
  }

  /**
   * Obtiene todas las plantillas
   */
  async findAll() {
    return await this.plantillaRepo.find({
      relations: ['creado_por'],
      order: { creado_en: 'DESC' },
    });
  }

  /**
   * Obtiene una plantilla por su UUID
   */
  async findOne(id: string) {
    const plantilla = await this.plantillaRepo.findOne({
      where: { id },
      relations: ['creado_por'],
    });

    if (!plantilla)
      throw new NotFoundException(`No se encontró la plantilla con id ${id}`);

    return plantilla;
  }

  /**
   * Actualiza parcialmente una plantilla
   */
  async update(id: string, updatePlantillaDto: UpdatePlantillaDto) {
    const plantilla = await this.findOne(id);

    if (!plantilla)
      throw new NotFoundException(`No existe la plantilla con id ${id}`);

    // Si viene un usuario nuevo, lo buscamos
    if (updatePlantillaDto.creado_por) {
      const creador = await this.userRepo.findOne({
        where: { id: updatePlantillaDto.creado_por },
      });
      if (!creador)
        throw new NotFoundException(
          `Usuario con id ${updatePlantillaDto.creado_por} no existe`,
        );
      plantilla.creado_por = creador;
    }

    Object.assign(plantilla, updatePlantillaDto);
    return await this.plantillaRepo.save(plantilla);
  }

  /**
   * Elimina una plantilla
   */
  async remove(id: string) {
    const plantilla = await this.findOne(id);
    await this.plantillaRepo.remove(plantilla);
    return { message: `Plantilla ${plantilla.nombre} eliminada correctamente` };
  }
}
