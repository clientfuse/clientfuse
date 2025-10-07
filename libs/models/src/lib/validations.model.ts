import { ImageFormat } from './storage.model';

const CONNECTION_LINK_VALIDATORS = {
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 128
  }
} as const;

const AGENCY_VALIDATORS = {
  WHITE_LABELING: {
    AGENCY_NAME: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 64
    },
    LOGO: {
      MAX_SIZE_MB: 3,
      MAX_SIZE_BYTES: 3 * 1024 * 1024, // 3 MB
      ALLOWED_FORMATS: [ImageFormat.PNG, ImageFormat.JPEG, ImageFormat.JPG],
      ALLOWED_EXTENSIONS: ['.png', '.jpg', '.jpeg']
    }
  }
} as const;

export const VALIDATORS = {
  CONNECTION_LINK: CONNECTION_LINK_VALIDATORS,
  AGENCY: AGENCY_VALIDATORS
} as const;
