import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Expediente } from './expediente.entity';
import { Documento } from './documento.entity';
import { Notificacion } from './notificacion.entity';
import { Plantilla } from './plantilla.entity';

export enum UserRole {
  ADMIN = 'admin',
  REVISOR = 'revisor',
  EDITOR = 'editor',
  USUARIO = 'usuario',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => Expediente, expediente => expediente.creado_por)
  expedientes: Expediente[];

  @OneToMany(() => Documento, documento => documento.subido_por)
  documentos: Documento[];

  @OneToMany(() => Notificacion, notificacion => notificacion.usuario)
  notificaciones: Notificacion[];

  @OneToMany(() => Plantilla, plantilla => plantilla.creado_por)
  plantillas: Plantilla[];
}
