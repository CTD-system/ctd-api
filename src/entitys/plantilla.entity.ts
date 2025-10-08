import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('plantillas')
export class Plantilla {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column('text')
  descripcion: string;

  @Column()
  tipo_archivo: string;

  @Column()
  ruta_archivo: string;

  @ManyToOne(() => User, user => user.plantillas)
  creado_por: User;

  @CreateDateColumn({ type: 'timestamp' })
  creado_en: Date;
}
