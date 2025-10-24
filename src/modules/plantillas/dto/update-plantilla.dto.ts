import { PartialType } from '@nestjs/mapped-types';
import { PlantillaDTO } from './create-plantilla.dto';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para actualizar una plantilla existente.
 * Hereda todas las propiedades del CreatePlantillaDto,
 * pero las hace opcionales automáticamente.
 */
export class UpdatePlantillaDto extends PartialType(PlantillaDTO) {
  // 🔹 Reafirmamos validación anidada para mantener compatibilidad con arrays de objetos
  @ValidateNested({ each: true })
  @Type(() => PlantillaDTO)
  override estructura?: PlantillaDTO['estructura'];

  @ValidateNested({ each: true })
  @Type(() => PlantillaDTO)
  override estilos_detectados?: PlantillaDTO['estilos_detectados'];

  
}
