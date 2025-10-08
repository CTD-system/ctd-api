import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Expediente } from './expediente.entity';
import { Documento } from './documento.entity';

export enum ModuloEstado {
  BORRADOR = 'borrador',
  EN_REVISION = 'en_revision',
  COMPLETADO = 'completado',
}

@Entity('modulos')
export class Modulo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Expediente, expediente => expediente.modulos)
  expediente: Expediente;

  @Column()
  numero: number;

  @Column()
  titulo: string;

  @Column('text')
  descripcion: string;

  @Column({ type: 'enum', enum: ModuloEstado })
  estado: ModuloEstado;

  @CreateDateColumn({ type: 'timestamp' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  actualizado_en: Date;

  @OneToMany(() => Documento, documento => documento.modulo)
  documentos: Documento[];
}
