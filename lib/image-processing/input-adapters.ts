import path from 'path';
import { ProcessImageInput } from './types';
import fs from 'fs';

export async function inputFromPath(
  filePath: string,
): Promise<ProcessImageInput> {
  const buffer = await fs.promises.readFile(filePath);

  return {
    buffer,
    filename: path.basename(filePath),
  };
}

export async function inputFromFile(file: File): Promise<ProcessImageInput> {
  const buffer = Buffer.from(await file.arrayBuffer());

  return {
    buffer,
    filename: file.name,
  };
}
