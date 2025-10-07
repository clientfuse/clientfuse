export enum LocalStorageKey {
  ACCESS_TOKEN = 'access_token',
}

export enum ImageFormat {
  PNG = 'image/png',
  JPG = 'image/jpeg',
  JPEG = 'image/jpeg',
  WEBP = 'image/webp',
  AVIF = 'image/avif',
  GIF = 'image/gif',
  TIFF = 'image/tiff',
}

export enum ImageResizeMode {
  COVER = 'cover',
  CONTAIN = 'contain',
  FILL = 'fill',
  INSIDE = 'inside',
  OUTSIDE = 'outside',
}

export interface IS3UploadResult {
  url: string;
  key: string;
  bucket: string;
}

export interface IFileUpload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface IImageResizeDimensions {
  width?: number;
  height?: number;
  maxDimension?: number;
}

export enum ImageDataType {
  BUFFER = 'buffer',
  BASE64 = 'base64',
  FILE = 'file',
  BLOB = 'blob',
  ARRAY_BUFFER = 'arrayBuffer',
}

export interface IImageProcessOptions {
  dimensions?: IImageResizeDimensions;
  quality?: number;
  outputFormat?: string;
  fit?: ImageResizeMode;
  keepMetadata?: boolean;
  outputType?: ImageDataType;
  onProgress?: (progress: number, stage: string) => void;
}

export interface IImageProcessResult {
  data: Buffer | string | Blob | ArrayBuffer;
  format: string;
  width: number;
  height: number;
  size: number;
}
