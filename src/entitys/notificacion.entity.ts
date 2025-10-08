import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Expediente } from './expediente.entity';

export enum NotificacionTipo {
  UPLOAD = 'upload',
  REVIEW = 'review',
  APPROVAL = 'approval',
  SYSTEM = 'system',
}

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: NotificacionTipo })
  tipo: NotificacionTipo;

  @Column('text')
  mensaje: string;

  @ManyToOne(() => User, user => user.notificaciones)
  usuario: User;

  @ManyToOne(() => Expediente, expediente => expediente.notificaciones, { nullable: true })
  expediente: Expediente;

  @Column({ default: false })
  leido: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  creado_en: Date;
}
