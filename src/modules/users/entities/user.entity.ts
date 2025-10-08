import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Expediente } from '../../expedientes/entities/expediente.entity';
import { Documento } from '../../documentos/entities/documento.entity';
import { Plantilla } from '../../plantillas/entities/plantilla.entity';

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

  @Column({ type: 'enum', enum: UserRole,default: UserRole.USUARIO  })
  role: UserRole;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => Expediente, expediente => expediente.creado_por)
  expedientes: Expediente[];

  @OneToMany(() => Documento, documento => documento.subido_por)
  documentos: Documento[];


  @OneToMany(() => Plantilla, plantilla => plantilla.creado_por)
  plantillas: Plantilla[];
}
