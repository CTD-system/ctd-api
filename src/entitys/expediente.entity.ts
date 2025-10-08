import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Modulo } from './modulo.entity';
import { Notificacion } from './notificacion.entity';

export enum ExpedienteEstado {
  BORRADOR = 'borrador',
  EN_REVISION = 'en_revision',
  APROBADO = 'aprobado',
  ENVIADO = 'enviado',
}

@Entity('expedientes')
export class Expediente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column('text')
  descripcion: string;

  @Column({ type: 'enum', enum: ExpedienteEstado })
  estado: ExpedienteEstado;

  @ManyToOne(() => User, user => user.expedientes)
  creado_por: User;

  @CreateDateColumn({ type: 'timestamp' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  actualizado_en: Date;

  @OneToMany(() => Modulo, modulo => modulo.expediente)
  modulos: Modulo[];

  @OneToMany(() => Notificacion, notificacion => notificacion.expediente)
  notificaciones: Notificacion[];
}
