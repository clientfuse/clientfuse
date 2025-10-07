import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ApiEnv, IFileUpload, ImageFormat, IS3UploadResult, VALIDATORS } from '@clientfuse/models';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get(ApiEnv.AWS_REGION),
      credentials: {
        accessKeyId: this.configService.get(ApiEnv.AWS_ACCESS_KEY_ID),
        secretAccessKey: this.configService.get(ApiEnv.AWS_SECRET_ACCESS_KEY)
      }
    });
    this.bucketName = this.configService.get(ApiEnv.AWS_S3_BUCKET_NAME);
  }

  async uploadFile(
    file: IFileUpload,
    folder: string
  ): Promise<IS3UploadResult> {
    const timestamp = Date.now();
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const key = `${folder}/${timestamp}-${sanitizedFilename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    });

    await this.s3Client.send(command);

    const url = `https://${this.bucketName}.s3.${this.configService.get(
      ApiEnv.AWS_REGION
    )}.amazonaws.com/${key}`;

    return {
      url,
      key,
      bucket: this.bucketName
    };
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });
    await this.s3Client.send(command);
  }

  validateImageFile(file: IFileUpload): boolean {
    const allowedMimeTypes = Object.values(ImageFormat);
    const maxSize = VALIDATORS.AGENCY.WHITE_LABELING.LOGO.MAX_SIZE_BYTES;

    return (
      allowedMimeTypes.includes(file.mimetype as ImageFormat) &&
      file.size <= maxSize
    );
  }
}
