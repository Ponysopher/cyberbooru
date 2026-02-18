import crypto from 'crypto';
import fs, { readdirSync } from 'fs';
import os from 'os';
import path from 'path';
// import { getPrismaClient } from '@/prisma/client-handle';
// import { PrismaClient } from '@/prisma/generated/prisma/client';

export default class TestWorkspace {
  root: string;
  imagesPath: string;
  thumbnailsPath: string;
  #ORIGINAL_BASE_IMAGES_PATH: string;
  #ORIGINAL_BASE_THUMBNAILS_PATH: string;
  // prisma: PrismaClient;

  private constructor(root: string) {
    this.root = root;
    this.imagesPath = path.join(root, 'images');
    this.thumbnailsPath = path.join(root, 'thumbnails');

    // temporarily override enviroment variables
    this.#ORIGINAL_BASE_IMAGES_PATH = process.env.BASE_IMAGES_PATH!;
    process.env.BASE_IMAGES_PATH = this.imagesPath;
    this.#ORIGINAL_BASE_THUMBNAILS_PATH = process.env.BASE_THUMBNAILS_PATH!;
    process.env.BASE_THUMBNAILS_PATH = this.thumbnailsPath;
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

  private copyFixtures(srcDir: string, dest: string) {
    console.debug(
      `Copying ${readdirSync(srcDir).length} images from ${srcDir} to ${dest}`,
    );
    fs.cpSync(srcDir, dest, { recursive: true });
    console.debug(`Copied ${readdirSync(dest).length} images`);
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

    // reset envrionment variables
    process.env.BASE_IMAGES_PATH = this.#ORIGINAL_BASE_IMAGES_PATH;
    process.env.BASE_THUMBNAILS_PATH = this.#ORIGINAL_BASE_THUMBNAILS_PATH;
  }
}
