import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { process_upload } from './process-upload';
import { inputFromPath } from './input-adapters';
import path from 'path';
import fs from 'fs';
import { Image } from '@/prisma/generated/prisma/client';
import { getPrismaClient } from '@/prisma/client-handle';
import TestWorkspace from '@/vitest-configs/utils/workspace';

if (!process.env.SAMPLE_UPLOADS_PATH)
  throw new Error('SAMPLE_UPLOADS_PATH is not set');

const SAMPLE_UPLOADS_DIR = process.env.SAMPLE_UPLOADS_PATH;

const imagesPath = process.env.BASE_IMAGES_PATH!;

describe.sequential('process_upload', async () => {
  const workspace = await TestWorkspace.create();
  let sample_upload_file_paths: string[] = [];
  let imageEntries: Image[] = [];
  let imageFiles: string[] = [];
  let thumbnails: string[] = [];

  beforeAll(async () => {
    workspace.copyImages(SAMPLE_UPLOADS_DIR);
    const thumbnailsPath = workspace.thumbnailsPath;
    const sample_upload_file_names = fs.readdirSync(workspace.imagesPath);
    sample_upload_file_paths = sample_upload_file_names.map((fileName) =>
      path.join(workspace.imagesPath, fileName),
    );

    const imageInputBuffers = sample_upload_file_paths.map(async (filePath) =>
      inputFromPath(filePath),
    );
    const upload_workers = imageInputBuffers.map(async (input) =>
      process_upload(await input),
    );
    // Entries returned from the database
    imageEntries = await Promise.all(upload_workers);

    // All image names
    imageFiles = fs
      .readdirSync(imagesPath)
      .map((fileName) => path.join(imagesPath, fileName));

    // All thumbnail names
    thumbnails = fs
      .readdirSync(thumbnailsPath)
      .map((fileName) => path.join(thumbnailsPath, fileName));
  });

  afterAll(async () => {
    await workspace.teardown();

    // Delete database records
    const prisma = getPrismaClient();
    await prisma.image.deleteMany({
      where: {
        id: { in: imageEntries.map(({ id }) => id) },
      },
    });
    await prisma.$disconnect();
  });

  it('inserts DB rows', () => {
    expect(
      imageEntries.map(({ fullPath }) => path.basename(fullPath)).sort(),
    ).toEqual(sample_upload_file_paths.sort());
  });

  it.each(imageEntries)('writes files', (imageEntry) => {
    expect(imageFiles.includes(imageEntry.fullPath));
  });

  it.each(imageEntries)('creates thumbnails', (imageEntry) => {
    expect(imageFiles.includes(imageEntry.fullPath));
  });

  // it.todo('returns metadata');
  // it('returns metadata', () => {});
});
