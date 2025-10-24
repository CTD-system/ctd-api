import { PartialType } from '@nestjs/mapped-types';
import { CreatePlantillaDto } from './create-plantilla.dto';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

/**
 * DTO para actualizar una plantilla existente.
 * Hereda todas las propiedades del CreatePlantillaDto,
 * pero las hace opcionales automáticamente.
 */
export class UpdatePlantillaDto extends PartialType(CreatePlantillaDto) {
  // 🔹 Reafirmamos validación anidada para mantener compatibilidad con arrays de objetos
  @ValidateNested({ each: true })
  @Type(() => CreatePlantillaDto)
  override capitulos?: CreatePlantillaDto['capitulos'];
}
