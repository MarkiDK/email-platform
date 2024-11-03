import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { ApiError } from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Readable } from 'stream';
import sharp from 'sharp';
import { IStorageOptions } from '@/interfaces/storage.interface';

class StorageService {
  private s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly allowedMimeTypes: string[];
  private readonly maxFileSize: number;

  constructor() {
    this.bucket = config.aws.s3.bucket;
    this.region = config.aws.region;
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
  }

  /**
   * Uploads a file to S3 storage
   */
  public async uploadFile(
    file: Express.Multer.File,
    options: IStorageOptions = {}
  ): Promise<string> {
    try {
      // Validate file
      this.validateFile(file);

      let fileBuffer = file.buffer;
      const originalFileName = file.originalname;
      const mimeType = file.mimetype;

      // Process image if needed
      if (
        options.processImage &&
        mimeType.startsWith('image/') &&
        mimeType !== 'image/gif'
      ) {
        fileBuffer = await this.processImage(fileBuffer, options);
      }

      // Generate unique file name
      const fileName = this.generateUniqueFileName(originalFileName);
      const key = options.folder ? `${options.folder}/${fileName}` : fileName;

      // Upload to S3
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: mimeType,
          Metadata: {
            originalName: originalFileName,
            uploadedAt: new Date().toISOString(),
          },
        })
      );

      // Generate signed URL if requested
      if (options.generateUrl) {
        return this.generateSignedUrl(key);
      }

      return key;
    } catch (error) {
      logger.error('File upload failed:', error);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to upload file'
      );
    }
  }

  /**
   * Downloads a file from S3 storage
   */
  public async downloadFile(key: string): Promise<Buffer> {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );

      return this.streamToBuffer(response.Body as Readable);
    } catch (error) {
      logger.error('File download failed:', error);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to download file'
      );
    }
  }

  /**
   * Deletes a file from S3 storage
   */
  public async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    } catch (error) {
      logger.error('File deletion failed:', error);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to delete file'
      );
    }
  }

  /**
   * Generates a signed URL for temporary file access
   */
  public async generateSignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      logger.error('Signed URL generation failed:', error);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to generate signed URL'
      );
    }
  }

  /**
   * Processes an image using Sharp
   */
  private async processImage(
    buffer: Buffer,
    options: IStorageOptions
  ): Promise<Buffer> {
    const image = sharp(buffer);

    if (options.resize) {
      image.resize(options.resize.width, options.resize.height, {
        fit: options.resize.fit || 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      });
    }

    if (options.compress) {
      image.jpeg({ quality: options.compress.quality || 80 });
    }

    return image.toBuffer();
  }

  /**
   * Validates file size and type
   */
  private validateFile(file: Express.Multer.File): void {
    if (file.size > this.maxFileSize) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'File type not allowed'
      );
    }
  }

  /**
   * Generates a unique file name
   */
  private generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${random}.${extension}`;
  }

  /**
   * Converts a readable stream to buffer
   */
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  /**
   * Checks if a file exists in S3
   */
  public async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }
}

export const storageService = new StorageService();