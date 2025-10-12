import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documento, DocumentoTipo } from './entities/documento.entity';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import { Modulo } from '../modulos/entities/modulo.entity';
import { User } from '../users/entities/user.entity';
import { HistorialService } from '../historial/historial.service';
import { HistorialAccion } from '../historial/entities/historial_documento.entity';

@Injectable()
export class DocumentosService {
  constructor(
    @InjectRepository(Documento)
    private readonly documentoRepo: Repository<Documento>,

    @InjectRepository(Modulo)
    private readonly moduloRepo: Repository<Modulo>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly historialService: HistorialService, // ✅ inyección del historial
  ) {}

  // Crear un nuevo documento
  async create(createDto: CreateDocumentoDto) {
    const { modulo_id, subido_por, ...rest } = createDto;

    const modulo = await this.moduloRepo.findOne({ where: { id: modulo_id } });
    if (!modulo) throw new NotFoundException('Módulo no encontrado.');

    let user: User | null = null;
    if (subido_por) {
      user = await this.userRepo.findOne({ where: { id: subido_por } });
      if (!user) throw new NotFoundException('Usuario no encontrado.');
    }

    const documento = this.documentoRepo.create({
      ...rest,
      tipo: (rest.tipo as DocumentoTipo) || DocumentoTipo.OTRO,
      version: rest.version || 1,
      modulo,
      subido_por: user || undefined,
    });

    const saved = await this.documentoRepo.save(documento);

    // ✅ Registrar historial automático
    await this.historialService.create({
      documento_id: saved.id,
      version: saved.version,
      accion: HistorialAccion.CREADO,
      usuario_id: user?.id,
      comentario: 'Documento creado automáticamente.',
    });

    return saved;
  }

  // Listar todos los documentos
  async findAll() {
    return this.documentoRepo.find({
      relations: ['modulo', 'subido_por'],
    });
  }

  // Obtener un documento específico
  async findOne(id: string) {
    const doc = await this.documentoRepo.findOne({
      where: { id },
      relations: ['modulo', 'subido_por'],
    });
    if (!doc) throw new NotFoundException('Documento no encontrado.');
    return doc;
  }

  // Actualizar documento (incrementa versión y registra historial)
  async update(id: string, updateDto: UpdateDocumentoDto) {
    const documento = await this.documentoRepo.findOne({ where: { id } });
    if (!documento) throw new NotFoundException('Documento no encontrado.');

    Object.assign(documento, updateDto);
    documento.version = (documento.version || 0) + 1; // ✅ incremento de versión

    const updated = await this.documentoRepo.save(documento);

    // ✅ Registrar historial automático
    await this.historialService.create({
      documento_id: updated.id,
      version: updated.version,
      accion: HistorialAccion.MODIFICADO,
      usuario_id: updateDto.subido_por,
      comentario: 'Documento actualizado automáticamente.',
    });

    return updated;
  }

  // Eliminar documento (y registrar historial)
  async remove(id: string) {
    const documento = await this.documentoRepo.findOne({ where: { id } });
    if (!documento) throw new NotFoundException('Documento no encontrado.');

    await this.documentoRepo.remove(documento);

    // ✅ Registrar historial automático
    await this.historialService.create({
      documento_id: id,
      version: documento.version,
      accion: HistorialAccion.ELIMINADO,
      usuario_id: documento.subido_por?.id,
      comentario: 'Documento eliminado del sistema.',
    });

    return { message: 'Documento eliminado correctamente.' };
  }
}
