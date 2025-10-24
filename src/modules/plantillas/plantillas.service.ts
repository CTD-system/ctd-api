import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plantilla } from './entities/plantilla.entity';
import { User } from '../users/entities/user.entity';
import { PlantillaDTO } from './dto/create-plantilla.dto';
import { UpdatePlantillaDto } from './dto/update-plantilla.dto';

@Injectable()
export class PlantillasService {
  constructor(
    @InjectRepository(Plantilla)
    private readonly plantillaRepository: Repository<Plantilla>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Crear una nueva plantilla
  async create(
    createPlantillaDTO: PlantillaDTO,
    userId: string,
  ): Promise<PlantillaDTO> {
    const { ...plantillaData } = createPlantillaDTO;

    // Verificar si el usuario existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const plantilla = this.plantillaRepository.create({
      ...plantillaData,
      creado_por: user,
    });

    await this.plantillaRepository.save(plantilla);
    return this.toDTO(plantilla);
  }

  // Obtener todas las plantillas
  async findAll(): Promise<PlantillaDTO[]> {
    const plantillas = await this.plantillaRepository.find({
      relations: ['creado_por'],
    });
    return plantillas.map((plantilla) => this.toDTO(plantilla));
  }

  // Obtener una plantilla por su ID
  async findOne(id: string): Promise<PlantillaDTO> {
    const plantilla = await this.plantillaRepository.findOne({
      where: { id },
      relations: ['creado_por'],
    });

    if (!plantilla) {
      throw new NotFoundException(`Plantilla con ID ${id} no encontrada`);
    }

    return this.toDTO(plantilla);
  }

  // Actualizar una plantilla
  async update(
    id: string,
    updatePlantillaDTO: UpdatePlantillaDto,
  ): Promise<PlantillaDTO> {
    const plantilla = await this.plantillaRepository.findOne({
      where: { id },
      relations: ['creado_por'],
    });

    if (!plantilla) {
      throw new NotFoundException(`Plantilla con ID ${id} no encontrada`);
    }

    const updatedPlantilla = this.plantillaRepository.merge(
      plantilla,
      updatePlantillaDTO,
    );
    await this.plantillaRepository.save(updatedPlantilla);
    return this.toDTO(updatedPlantilla);
  }

  // Eliminar una plantilla
  async remove(id: string): Promise<void> {
    const plantilla = await this.plantillaRepository.findOne({ where: { id } });
    if (!plantilla) {
      throw new NotFoundException(`Plantilla con ID ${id} no encontrada`);
    }

    await this.plantillaRepository.remove(plantilla);
  }

  // Convertir la entidad a DTO
  private toDTO(plantilla: Plantilla): PlantillaDTO {
    const { creado_por, ...plantillaData } = plantilla;
    return {
      ...plantillaData,
      creado_por: {
        id: creado_por.id,
        username: creado_por.username,
        email: creado_por.email,
        
      },
    };
  }
}
