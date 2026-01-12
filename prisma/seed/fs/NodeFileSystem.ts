import FileSystem from './FileSystem';
import fs from 'fs';

const realFs: FileSystem = {
  readdir: fs.promises.readdir,
  stat: fs.promises.stat,
  readFile: fs.promises.readFile,
  existsSync: fs.existsSync,
  mkdir: fs.promises.mkdir,
  mkdirSync: fs.mkdirSync,
};

export default realFs;
