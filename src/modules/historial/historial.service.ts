import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistorialDocumento, HistorialAccion } from './entities/historial_documento.entity';
import { Documento } from '../documentos/entities/documento.entity';
import { User } from '../users/entities/user.entity';
import { CreateHistorialDto } from './dto/create-historial.dto';
import { UpdateHistorialDto } from './dto/update-historial.dto';

@Injectable()
export class HistorialService {
  constructor(
    @InjectRepository(HistorialDocumento)
    private readonly historialRepo: Repository<HistorialDocumento>,

    @InjectRepository(Documento)
    private readonly documentoRepo: Repository<Documento>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async deleteByDocumentoId(documento_id: string) {
  await this.historialRepo
    .createQueryBuilder()
    .delete()
    .from(HistorialDocumento)
    .where('documentoId = :documento_id', { documento_id })
    .execute();
}



  // Crear registro en el historial
  async create(createDto: CreateHistorialDto) {
    const { documento_id, version, accion, usuario_id, comentario } = createDto;

    const documento = await this.documentoRepo.findOne({ where: { id: documento_id } });
    if (!documento) throw new NotFoundException('Documento no encontrado.');

    let usuario: User | null = null;
    if (usuario_id) {
      usuario = await this.userRepo.findOne({ where: { id: usuario_id } });
      if (!usuario) throw new NotFoundException('Usuario no encontrado.');
    }

    const historial = this.historialRepo.create({
      documento,
      version,
      accion: accion as HistorialAccion,
      usuario: usuario || undefined,
      comentario: comentario || undefined,
    });

    return await this.historialRepo.save(historial);
  }

  // Listar todos los registros
  async findAll() {
    return await this.historialRepo.find({
      relations: ['documento', 'usuario'],
      order: { fecha: 'DESC' },
    });
  }

  // Obtener un registro por ID
  async findOne(id: string) {
    const historial = await this.historialRepo.findOne({
      where: { id },
      relations: ['documento', 'usuario'],
    });
    if (!historial) throw new NotFoundException('Registro de historial no encontrado.');
    return historial;
  }

  // Actualizar registro (solo comentario o acción, por ejemplo)
  async update(id: string, updateDto: UpdateHistorialDto) {
    const historial = await this.historialRepo.findOne({ where: { id } });
    if (!historial) throw new NotFoundException('Registro de historial no encontrado.');

    Object.assign(historial, {
      version: updateDto.version ?? historial.version,
      accion: (updateDto.accion as HistorialAccion) ?? historial.accion,
      comentario: updateDto.comentario ?? historial.comentario,
    });

    return await this.historialRepo.save(historial);
  }

  // Eliminar registro (opcional)
  async remove(id: string) {
    const historial = await this.historialRepo.findOne({ where: { id } });
    if (!historial) throw new NotFoundException('Registro de historial no encontrado.');
    await this.historialRepo.remove(historial);
    return { message: 'Registro de historial eliminado correctamente.' };
  }
}
