export interface ImageMetadata {
  width: number | null;
  height: number | null;
  mimeType: string;
  fileSizeKB: number;
  sha256Hash: string | null;
  nsfw: boolean;
}

export interface ProcessImageInput {
  buffer: Buffer;
  filename: string;
}
