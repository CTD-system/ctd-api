import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Documento } from '../../documentos/entities/documento.entity';
import { User } from '../../users/entities/user.entity';

export enum HistorialAccion {
  CREADO = 'creado',
  MODIFICADO = 'modificado',
  ELIMINADO = 'eliminado',
  APROBADO = 'aprobado',
}

@Entity('historial_documentos')
export class HistorialDocumento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Documento, documento => documento.historial)
  documento: Documento;

  @Column()
  version: number;

  @Column({ type: 'enum', enum: HistorialAccion })
  accion: HistorialAccion;

  @ManyToOne(() => User)
  usuario: User;

  @CreateDateColumn({ type: 'timestamp' })
  fecha: Date;

  @Column('text', { nullable: true })
  comentario: string;
}
