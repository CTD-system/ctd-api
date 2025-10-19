import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'minio';

@Injectable()
export class MinioService {
  private readonly minioClient: Client;
  private readonly logger = new Logger(MinioService.name);

  constructor() {
    this.minioClient = new Client({
      endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
  }

  async uploadFile(bucket: string, fileName: string, filePath: string, metaData: Record<string, any> = {}) {
    await this.ensureBucket(bucket);
    this.logger.log(`Subiendo archivo ${fileName} al bucket ${bucket}`);
    return this.minioClient.fPutObject(bucket, fileName, filePath, metaData);
  }

   async uploadExpedienteFile(
    expedienteCodigo: string,
    moduloNumero: number | string,
    fileName: string,
    filePath: string,
  ) {
    const objectKey = `expedientes/${expedienteCodigo}/modulo-${moduloNumero}/${fileName}`;
    return this.uploadFile('ctd-expedientes', objectKey, filePath);
  }

  async createFolder(bucket: string, folderPath: string) {
    const emptyBuffer = Buffer.from('');
    const key = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    return this.minioClient.putObject(bucket, key, emptyBuffer);
  }
  

  async removeFolder(bucket: string, prefix: string) {
    const objects: string[] = [];
    const stream = this.minioClient.listObjectsV2(bucket, prefix, true);

    for await (const obj of stream) {
      if (obj.name) objects.push(obj.name);
    }

    if (objects.length > 0) {
      await this.minioClient.removeObjects(bucket, objects);
    }
  }

  

  async downloadFile(bucket: string, fileName: string, downloadPath: string) {
    await this.ensureBucket(bucket);
    this.logger.log(`Descargando archivo ${fileName} del bucket ${bucket}`);
    return this.minioClient.fGetObject(bucket, fileName, downloadPath);
  }

  async getFileStream(bucket: string, fileName: string) {
    await this.ensureBucket(bucket);
    return this.minioClient.getObject(bucket, fileName);
  }

  /**
   * Asegura que el bucket exista, si no lo crea.
   */
  public async ensureBucket(bucket: string) {
    const exists = await this.minioClient.bucketExists(bucket);
    if (!exists) {
      this.logger.log(`Bucket ${bucket} no existe. Creando...`);
      await this.minioClient.makeBucket(bucket, 'us-east-1');
    }
  }

  /**
   * Elimina un objeto de un bucket dado.
   */
  public async removeObject(bucket: string, objectName: string): Promise<void> {
    await this.ensureBucket(bucket);
    this.logger.log(`Eliminando archivo ${objectName} del bucket ${bucket}`);
    await this.minioClient.removeObject(bucket, objectName);
  }
}
