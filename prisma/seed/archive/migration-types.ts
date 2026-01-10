export interface ImageData {
  height: number;
  width: number;
  size?: number;
  tags: string[];
  fullPath: string;
  thumbnailPath: string;
  largeFilePath?: string;
}