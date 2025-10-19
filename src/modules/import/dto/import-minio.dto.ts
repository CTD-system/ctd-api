import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ImportarMinioDto {
  @ApiProperty({
    description: 'Nombre del archivo ZIP almacenado en el bucket de MinIO',
    example: 'CTD_123.zip',
  })
  @IsString()
  @IsNotEmpty()
  minioFileName: string;
}
