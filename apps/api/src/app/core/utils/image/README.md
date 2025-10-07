# Image Processing Utility

Universal utility for image processing and compression using the Sharp library.

## Features

- ✅ Support for all popular formats: JPEG, PNG, WebP, AVIF, GIF, TIFF
- ✅ Flexible input: Buffer, Base64, File, Blob, ArrayBuffer
- ✅ Flexible output: Buffer, Base64, Blob, ArrayBuffer
- ✅ Smart resizing (exact dimensions or proportional)
- ✅ Downscaling only (no image enlargement)
- ✅ Configurable compression quality
- ✅ Format conversion
- ✅ Optional metadata preservation
- ✅ Progress callbacks for long operations

## Installation

The utility is already installed in the project. To use it, simply import:

```typescript
import { processImage, processImageSimple } from './utils/image';
```

## Usage

### Basic Example - Compression for S3 Upload

```typescript
import { processImageSimple } from './utils/image';
import { S3Service } from './core/services/aws/s3.service';

@Injectable()
export class AgenciesService {
  constructor(private s3Service: S3Service) {}

  async uploadAgencyLogo(file: IFileUpload): Promise<IS3UploadResult> {
    // Compress image to maximum 800px on the largest side
    const processedBuffer = await processImageSimple(
      file.buffer,
      800,  // maxDimension
      85    // quality (0-100)
    );

    // Upload to S3
    return this.s3Service.uploadFile({
      buffer: processedBuffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: processedBuffer.length,
    });
  }
}
```

### Advanced Example - Full Control

```typescript
import { processImage } from './utils/image';
import { ImageResizeMode, ImageDataType } from '@clientfuse/models';

async uploadWithProgress(file: IFileUpload) {
  const result = await processImage(file.buffer, {
    // Exact dimensions
    dimensions: {
      width: 800,
      height: 600,
    },

    // Fit mode (cover, contain, fill, inside, outside)
    fit: ImageResizeMode.COVER,

    // Quality (0-100)
    quality: 90,

    // Convert to WebP
    outputFormat: 'image/webp',

    // Preserve metadata (EXIF, ICC, XMP)
    keepMetadata: true,

    // Output format
    outputType: ImageDataType.BUFFER,

    // Progress tracking
    onProgress: (progress, stage) => {
      console.log(`${stage}: ${progress}%`);
    },
  });

  console.log(`Processed: ${result.width}x${result.height}, ${result.size} bytes`);

  return this.s3Service.uploadFile({
    buffer: result.data as Buffer,
    originalname: 'logo.webp',
    mimetype: 'image/webp',
    size: result.size,
  });
}
```

### Proportional Resizing

```typescript
// By largest side
const result = await processImage(file.buffer, {
  dimensions: {
    maxDimension: 1920, // Will resize to 1920px on the largest side
  },
  quality: 80,
});

// Or by width/height with preserved aspect ratio
const result = await processImage(file.buffer, {
  dimensions: {
    width: 800, // Height will be calculated automatically
  },
  quality: 80,
});
```

### Format Conversion

```typescript
// JPEG → WebP
const webpResult = await processImage(jpegBuffer, {
  outputFormat: 'image/webp',
  quality: 85,
});

// PNG → AVIF (modern format with excellent compression)
const avifResult = await processImage(pngBuffer, {
  outputFormat: 'image/avif',
  quality: 80,
});

// Any format → optimized PNG
const pngResult = await processImage(inputBuffer, {
  outputFormat: 'image/png',
  // PNG uses lossless compression with maximum level
});
```

### Working with Base64

```typescript
import { ImageDataType } from '@clientfuse/models';

// Input: Base64
const base64Input = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
const result = await processImage(base64Input, {
  dimensions: { maxDimension: 500 },
  quality: 80,
  outputType: ImageDataType.BASE64, // Output also in Base64
});

console.log(result.data); // Base64 string
```

### Different Fit Modes

```typescript
// COVER - fills the area, crops excess (default)
await processImage(buffer, {
  dimensions: { width: 800, height: 600 },
  fit: ImageResizeMode.COVER,
});

// CONTAIN - fits completely, may add padding
await processImage(buffer, {
  dimensions: { width: 800, height: 600 },
  fit: ImageResizeMode.CONTAIN,
});

// FILL - stretches without preserving aspect ratio
await processImage(buffer, {
  dimensions: { width: 800, height: 600 },
  fit: ImageResizeMode.FILL,
});

// INSIDE - fits inside, not exceeding dimensions
await processImage(buffer, {
  dimensions: { width: 800, height: 600 },
  fit: ImageResizeMode.INSIDE,
});

// OUTSIDE - fits outside
await processImage(buffer, {
  dimensions: { width: 800, height: 600 },
  fit: ImageResizeMode.OUTSIDE,
});
```

### Controller Example

```typescript
@Post(ENDPOINTS.agencies.uploadLogo)
@UseInterceptors(FileInterceptor('logo'))
async uploadLogo(
  @Param('id') id: string,
  @UploadedFile() file: any
): Promise<IS3UploadResult> {
  // Process image
  const processedBuffer = await processImageSimple(
    file.buffer,
    1200, // maximum size
    85    // quality
  );

  // Upload to S3
  const s3Result = await this.s3Service.uploadFile({
    buffer: processedBuffer,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: processedBuffer.length,
  }, 'agency-logos');

  // Update agency in database
  await this.agenciesService.updateAgency(id, {
    logoUrl: s3Result.url,
  });

  return s3Result;
}
```

## API Reference

### `processImage(input, options)`

Main image processing function.

**Parameters:**
- `input`: `Buffer | string | ArrayBuffer | Blob | File` - input image
- `options`: `IImageProcessOptions` - processing options

**Returns:** `Promise<IImageProcessResult>`

### `processImageSimple(input, maxDimension?, quality?)`

Simplified version for quick usage.

**Parameters:**
- `input`: `Buffer | string | ArrayBuffer | Blob | File` - input image
- `maxDimension`: `number` (optional) - maximum size on the largest side
- `quality`: `number` (optional) - quality (0-100)

**Returns:** `Promise<Buffer>`

## Types

### `IImageProcessOptions`

```typescript
interface IImageProcessOptions {
  dimensions?: IImageResizeDimensions;
  quality?: number;                    // 0-100, default 80
  outputFormat?: string;               // 'image/jpeg', 'image/png', etc.
  fit?: ImageResizeMode;               // default COVER
  keepMetadata?: boolean;              // default false
  outputType?: ImageDataType;          // default BUFFER
  onProgress?: (progress: number, stage: string) => void;
}
```

### `ImageDataType` (enum)

```typescript
enum ImageDataType {
  BUFFER = 'buffer',
  BASE64 = 'base64',
  FILE = 'file',
  BLOB = 'blob',
  ARRAY_BUFFER = 'arrayBuffer',
}
```

### `IImageResizeDimensions`

```typescript
interface IImageResizeDimensions {
  width?: number;        // Exact width
  height?: number;       // Exact height
  maxDimension?: number; // OR proportional resize
}
```

### `IImageProcessResult`

```typescript
interface IImageProcessResult {
  data: Buffer | string | Blob | ArrayBuffer;
  format: string;
  width: number;
  height: number;
  size: number;
}
```

## Implementation Details

1. **Downscaling only**: The utility never enlarges images (withoutEnlargement: true)
2. **Format-specific optimization**:
   - PNG: maximum lossless compression (compressionLevel: 9)
   - JPEG: uses mozjpeg for better compression
   - WebP/AVIF: supports both lossy and lossless
3. **Metadata**: Removed by default to reduce size, but can be preserved
4. **Progress tracking**: Progress tracking at each processing stage

## Performance

- Fast processing thanks to Sharp's native bindings
- Streaming support for large files
- Optimized memory usage

## Supported Formats

- **Input**: JPEG, PNG, WebP, AVIF, GIF, TIFF, SVG
- **Output**: JPEG, PNG, WebP, AVIF, GIF, TIFF
