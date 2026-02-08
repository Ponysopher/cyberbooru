import { SUPPORTED_IMAGE_FORMATS_REGEX } from '@/constants';
import fs from 'fs';
import { promises as fsp } from 'fs';

interface ScanOptions {
  recurse?: boolean;
  ignoreHidden?: boolean;
}

export async function scanLocalImages(
  dirPath: string,
  opts: ScanOptions = { recurse: false, ignoreHidden: true },
): Promise<string[]> {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory ${dirPath} does not exist.`);
  }

  const entries = await fsp.readdir(dirPath);
  const results: string[] = [];

  for (const entry of entries) {
    if (opts.ignoreHidden && entry.startsWith('.')) continue;

    const fullPath = `${dirPath.replace(/\/+$/, '')}/${entry}`;
    const stats = await fsp.stat(fullPath);

    if (stats.isFile() && SUPPORTED_IMAGE_FORMATS_REGEX.test(entry)) {
      results.push(fullPath);
    } else if (stats.isDirectory() && opts.recurse) {
      const nested = await scanLocalImages(fullPath, opts);
      results.push(...nested);
    }
  }

  return results;
}
