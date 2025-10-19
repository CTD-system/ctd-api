import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Expediente } from '../../expedientes/entities/expediente.entity';
import { Documento } from '../../documentos/entities/documento.entity';

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

    @ManyToOne(() => Modulo, modulo => modulo.submodulos, { nullable: true })
  moduloContenedor?: Modulo;

  @OneToMany(() => Modulo, modulo => modulo.moduloContenedor)
  submodulos: Modulo[];

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

  // Archivo Word de índice
  @Column({ nullable: true })
  indice_word_nombre?: string;

  @Column({ nullable: true })
  indice_word_ruta?: string;

   @Column({ length: 255, nullable: false })
  ruta: string;

  // Archivo Word de referencias bibliográficas
  @Column({ nullable: true })
  referencias_word_nombre?: string;

  @Column({ nullable: true })
  referencias_word_ruta?: string;
}
