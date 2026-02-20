import { randomUUID } from 'crypto';
import path from 'path';

export function getUniqueFileName(fileName: string): string {
  return randomUUID() + path.extname(fileName);
}
