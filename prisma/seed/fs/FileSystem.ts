export default interface FileSystem {
  readdir(path: string): Promise<string[]>;
  stat(
    path: string,
  ): Promise<{ isFile(): boolean; isDirectory(): boolean; size?: number }>;
  readFile(path: string): Promise<Buffer>;
  existsSync(path: string): boolean;
  mkdir(path: string): Promise<void>;
  mkdirSync(path: string, opts: { recursive: boolean }): void;
}
