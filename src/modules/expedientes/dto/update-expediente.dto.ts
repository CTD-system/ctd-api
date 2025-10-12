import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateExpedienteDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsIn(['borrador', 'en_revision', 'aprobado', 'enviado'])
  estado?: string;
}
