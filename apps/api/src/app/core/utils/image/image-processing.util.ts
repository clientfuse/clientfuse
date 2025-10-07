import sharp, { FormatEnum } from 'sharp';
import {
  IImageProcessOptions,
  IImageProcessResult,
  ImageResizeMode,
  ImageDataType,
} from '@clientfuse/models';

type ImageInput = Buffer | string | ArrayBuffer | Blob | File;

export class ImageProcessingUtil {
  private static reportProgress(
    options: IImageProcessOptions,
    progress: number,
    stage: string
  ): void {
    if (options.onProgress) {
      options.onProgress(progress, stage);
    }
  }

  private static async normalizeInput(
    input: ImageInput
  ): Promise<Buffer> {
    if (Buffer.isBuffer(input)) {
      return input;
    }

    if (typeof input === 'string') {
      const base64Match = input.match(/^data:image\/[a-z]+;base64,(.+)$/);
      if (base64Match) {
        return Buffer.from(base64Match[1], 'base64');
      }
      return Buffer.from(input, 'base64');
    }

    if (input instanceof ArrayBuffer) {
      return Buffer.from(input);
    }

    if (input instanceof Blob || (input as any) instanceof File) {
      const arrayBuffer = await (input as Blob).arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    throw new Error('Unsupported input type');
  }

  private static async calculateDimensions(
    metadata: sharp.Metadata,
    options: IImageProcessOptions
  ): Promise<{ width?: number; height?: number }> {
    const { dimensions } = options;

    if (!dimensions) {
      return {};
    }

    if (dimensions.maxDimension) {
      const maxSide = Math.max(metadata.width || 0, metadata.height || 0);
      const scale = dimensions.maxDimension / maxSide;

      if (scale >= 1) {
        return {};
      }

      return {
        width: Math.round((metadata.width || 0) * scale),
        height: Math.round((metadata.height || 0) * scale),
      };
    }

    return {
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  private static getSharpFormat(
    format: string
  ): keyof FormatEnum | undefined {
    const formatMap: Record<string, keyof FormatEnum> = {
      'image/jpeg': 'jpeg',
      'image/jpg': 'jpeg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/avif': 'avif',
      'image/gif': 'gif',
      'image/tiff': 'tiff',
      jpeg: 'jpeg',
      jpg: 'jpeg',
      png: 'png',
      webp: 'webp',
      avif: 'avif',
      gif: 'gif',
      tiff: 'tiff',
    };

    return formatMap[format.toLowerCase()];
  }

  private static isLosslessFormat(format: string): boolean {
    const losslessFormats = ['png', 'tiff', 'gif'];
    return losslessFormats.includes(format.toLowerCase());
  }

  private static async formatOutput(
    buffer: Buffer,
    outputType: ImageDataType
  ): Promise<Buffer | string | Blob | ArrayBuffer> {
    switch (outputType) {
      case ImageDataType.BUFFER:
        return buffer;

      case ImageDataType.BASE64:
        return buffer.toString('base64');

      case ImageDataType.ARRAY_BUFFER:
        return buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        );

      case ImageDataType.BLOB:
        return new Blob([buffer]);

      default:
        return buffer;
    }
  }

  public static async processImage(
    input: ImageInput,
    options: IImageProcessOptions = {}
  ): Promise<IImageProcessResult> {
    try {
      this.reportProgress(options, 0, 'Starting image processing');

      const inputBuffer = await this.normalizeInput(input);
      this.reportProgress(options, 10, 'Input normalized');

      let sharpInstance = sharp(inputBuffer);
      const metadata = await sharpInstance.metadata();
      this.reportProgress(options, 20, 'Metadata extracted');

      const calculatedDimensions = await this.calculateDimensions(
        metadata,
        options
      );
      this.reportProgress(options, 30, 'Dimensions calculated');

      const fit = options.fit || ImageResizeMode.COVER;

      if (calculatedDimensions.width || calculatedDimensions.height) {
        sharpInstance = sharpInstance.resize({
          width: calculatedDimensions.width,
          height: calculatedDimensions.height,
          fit: fit as any,
          withoutEnlargement: true,
        });
      }
      this.reportProgress(options, 50, 'Resize applied');

      const outputFormat =
        options.outputFormat || metadata.format || 'jpeg';
      const sharpFormat = this.getSharpFormat(outputFormat);

      if (!sharpFormat) {
        throw new Error(`Unsupported output format: ${outputFormat}`);
      }

      const quality = options.quality ?? 80;
      const isLossless = this.isLosslessFormat(sharpFormat);

      switch (sharpFormat) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({
            quality,
            mozjpeg: true,
          });
          break;

        case 'png':
          sharpInstance = sharpInstance.png({
            compressionLevel: 9,
            quality: isLossless ? 100 : quality,
          });
          break;

        case 'webp':
          sharpInstance = sharpInstance.webp({
            quality,
            lossless: isLossless,
          });
          break;

        case 'avif':
          sharpInstance = sharpInstance.avif({
            quality,
            lossless: isLossless,
          });
          break;

        case 'gif':
          sharpInstance = sharpInstance.gif();
          break;

        case 'tiff':
          sharpInstance = sharpInstance.tiff({
            quality,
            compression: 'lzw',
          });
          break;
      }

      if (options.keepMetadata) {
        sharpInstance = sharpInstance.keepMetadata();
      }

      this.reportProgress(options, 70, 'Format and compression applied');

      const outputBuffer = await sharpInstance.toBuffer({ resolveWithObject: true });
      this.reportProgress(options, 90, 'Image processed');

      const outputType = options.outputType || ImageDataType.BUFFER;
      const formattedOutput = await this.formatOutput(
        outputBuffer.data,
        outputType
      );
      this.reportProgress(options, 100, 'Output formatted');

      return {
        data: formattedOutput,
        format: sharpFormat,
        width: outputBuffer.info.width,
        height: outputBuffer.info.height,
        size: outputBuffer.info.size,
      };
    } catch (error) {
      throw new Error(
        `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public static async processImageSimple(
    input: ImageInput,
    maxDimension?: number,
    quality?: number
  ): Promise<Buffer> {
    const result = await this.processImage(input, {
      dimensions: maxDimension ? { maxDimension } : undefined,
      quality,
      outputType: ImageDataType.BUFFER,
    });

    return result.data as Buffer;
  }
}

export const processImage = ImageProcessingUtil.processImage.bind(
  ImageProcessingUtil
);
export const processImageSimple = ImageProcessingUtil.processImageSimple.bind(
  ImageProcessingUtil
);
