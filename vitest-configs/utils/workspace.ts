import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
// import { getPrismaClient } from '@/prisma/client-handle';
// import { PrismaClient } from '@/prisma/generated/prisma/client';

export default class TestWorkspace {
  root: string;
  imagesPath: string;
  thumbnailsPath: string;
  // prisma: PrismaClient;

  private constructor(root: string) {
    this.root = root;
    this.imagesPath = path.join(root, 'images');
    this.thumbnailsPath = path.join(root, 'thumbnails');
    // this.prisma = getPrismaClient();
  }

  static async create(): Promise<TestWorkspace> {
    const root = fs.mkdtempSync(
      path.join(os.tmpdir(), `cyb-${crypto.randomUUID()}`),
    );

    const workspace = new TestWorkspace(root);

    fs.mkdirSync(workspace.imagesPath);
    fs.mkdirSync(workspace.thumbnailsPath);

    return workspace;
  }

  // async resetDatabase() {
  //   await this.prisma.image.deleteMany();
  //   await this.prisma.tag.deleteMany();
  // }

  copyFixtures(srcDir: string, destSubDir: string) {
    const dest = path.join(this.root, destSubDir);
    fs.cpSync(srcDir, dest, { recursive: true });
    return dest;
  }

  copyImages(srcDir: string) {
    this.copyFixtures(srcDir, this.imagesPath);
  }

  copyThumbnails(srcDir: string) {
    this.copyFixtures(srcDir, this.thumbnailsPath);
  }

  async teardown() {
    // await this.prisma.$disconnect();
    if (!this.root.includes('cyb-')) {
      throw new Error('Refusing to delete non-test directory');
    }
    fs.rmSync(this.root, { recursive: true, force: true });
  }
}
