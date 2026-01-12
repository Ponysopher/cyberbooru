import type FileSystem from './FileSystem';

type MockEntry = { dir: true; children: string[] } | Buffer;

export class MockFileSystem implements FileSystem {
  constructor(private fs: Record<string, MockEntry>) {}

  async readdir(path: string): Promise<string[]> {
    const normalized = path.replace(/\/+$/, '');
    const entry = this.fs[normalized];
    if (!entry || !('dir' in entry))
      throw new Error(`Not a directory: ${normalized}`);
    return entry.children;
  }

  existsSync(path: string): boolean {
    // normalize to remove trailing slashes
    const normalized = path.replace(/\/+$/, '');
    return normalized in this.fs;
  }

  async stat(path: string) {
    const entry = this.fs[path];
    if (!entry) throw new Error(`No such file or directory: ${path}`);
    const isDirectory = 'dir' in entry;
    return {
      isFile: () => !isDirectory,
      isDirectory: () => isDirectory,
      size: isDirectory ? 0 : (entry as Buffer).length,
    };
  }

  async readFile(path: string): Promise<Buffer> {
    const normalized = path.replace(/\/+$/, '');
    const entry = this.fs[normalized];
    if (!entry || 'dir' in entry) throw new Error(`Not a file: ${normalized}`);
    return entry as Buffer;
  }

  async mkdir(path: string) {
    if (this.fs[path]) throw new Error(`Already exists: ${path}`);
    this.fs[path] = { dir: true, children: [] };
  }

  mkdirSync(path: string, opts: { recursive: boolean }): void {
    if (this.fs[path]) throw new Error(`Already exists: ${path}`);
    this.fs[path] = { dir: true, children: [] };
  }
}
