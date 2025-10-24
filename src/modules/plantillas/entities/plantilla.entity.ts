import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Documento } from '../../documentos/entities/documento.entity';
type Bloque =
  | {
      tipo: 'capitulo' | 'subcapitulo';
      titulo: string;
      bloques?: Bloque[];
    }
  | {
      tipo: 'parrafo';
      texto: string;
    }
  | {
      tipo: 'tabla';
      encabezados: string[];
      filas: string[][];
    }
  | {
      tipo: 'imagen';
      src: string;
      alt?: string;
    }
  | {
      tipo: 'placeholder';
      clave: string;
      descripcion?: string;
    };
@Entity('plantillas')
export class Plantilla {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column('text')
  descripcion: string;

  // 📄 Documento base subido
  @OneToOne(() => Documento, { onDelete: 'CASCADE', eager: true })
  @JoinColumn()
  documento: Documento;

  @Column({ nullable: true })
  tipo_archivo: string;

  @Column()
  ruta_archivo: string;

  @ManyToOne(() => User, (user) => user.plantillas, { eager: true })
  creado_por: User;

  @CreateDateColumn({ type: 'timestamp' })
  creado_en: Date;

  // --- ⚙️ CONFIGURACIÓN GENERAL DE LA PLANTILLA WORD ---

  @Column({ nullable: true })
  titulo?: string;

  // 🔹 Contenido del encabezado (header del documento)
  @Column({ type: 'text', nullable: true })
  encabezado?: string;

  // 🔹 Contenido del pie de página (footer del documento)
  @Column({ type: 'text', nullable: true })
  pie_pagina?: string;

  @Column({ default: 'Arial' })
  fuente: string;

  @Column({ type: 'float', default: 12 })
  tamano_fuente: number;

  @Column({ default: '#000000' })
  color_texto: string;

  @Column({ default: false })
  tiene_tablas: boolean;

  @Column({ default: false })
  autogenerar_indice: boolean;

  // --- 🧩 ESTRUCTURA INTERNA DE CAPÍTULOS, SUBCAPÍTULOS Y TABLAS ---
  @Column({ type: 'json', nullable: true })
  estructura?: {
    tipo: 'documento';
    titulo?: string;
    bloques: Bloque[];
  };

  @Column({ type: 'json', nullable: true })
  estilos_detectados?: {
    nombres_estilos?: string[];
    estilos_personalizados?: {
      nombre: string;
      fuente?: string;
      tamano_fuente?: number;
      color?: string;
      negrita?: boolean;
      cursiva?: boolean;
    }[];
  };
}
