import type FileSystem from './fs/FileSystem';
import realFs from './fs/NodeFileSystem';

interface ScanOptions {
  recurse?: boolean;
  ignoreHidden?: boolean;
}

export async function scanLocalImages(
  path: string,
  opts: ScanOptions = { recurse: false, ignoreHidden: true },
  fsImpl: FileSystem = realFs,
): Promise<string[]> {
  if (!fsImpl.existsSync(path)) {
    throw new Error(`Directory ${path} does not exist.`);
  }

  const entries = await fsImpl.readdir(path);
  const results: string[] = [];

  for (const entry of entries) {
    if (opts.ignoreHidden && entry.startsWith('.')) continue;

    const fullPath = `${path.replace(/\/+$/, '')}/${entry}`;
    const stats = await fsImpl.stat(fullPath);

    if (stats.isFile() && /\.(jpe?g|png|webp)$/i.test(entry)) {
      results.push(fullPath);
    } else if (stats.isDirectory() && opts.recurse) {
      const nested = await scanLocalImages(fullPath, opts, fsImpl);
      results.push(...nested);
    }
  }

  return results;
}
