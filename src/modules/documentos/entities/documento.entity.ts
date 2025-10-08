import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Modulo } from '../../modulos/entities/modulo.entity';
import { User } from '../../users/entities/user.entity';
import { HistorialDocumento } from '../../historial/entities/historial_documento.entity';

export enum DocumentoTipo {
  PLANTILLA = 'plantilla',
  ANEXO = 'anexo',
  INFORME = 'informe',
  OTRO = 'otro',
}

@Entity('documentos')
export class Documento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Modulo, modulo => modulo.documentos)
  modulo: Modulo;

  @Column()
  nombre: string;

  @Column({ type: 'enum', enum: DocumentoTipo })
  tipo: DocumentoTipo;

  @Column()
  version: number;

  @Column()
  ruta_archivo: string;

  @Column()
  mime_type: string;

  @ManyToOne(() => User, user => user.documentos)
  subido_por: User;

  @CreateDateColumn({ type: 'timestamp' })
  subido_en: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  actualizado_en: Date;

  @OneToMany(() => HistorialDocumento, historial => historial.documento)
  historial: HistorialDocumento[];
}
