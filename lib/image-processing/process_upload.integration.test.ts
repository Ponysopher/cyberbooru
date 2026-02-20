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

describe.sequential('process_upload', () => {
  let workspace: TestWorkspace;
  let sample_upload_file_paths: string[] = [];
  let imageEntries: Image[] = [];
  let imageFiles: string[] = [];
  let thumbnails: string[] = [];

  beforeAll(async () => {
    workspace = await TestWorkspace.create();
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
      process_upload(
        await input,
        workspace.imagesPath,
        workspace.thumbnailsPath,
      ),
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
    expect(imageEntries).toHaveLength(sample_upload_file_paths.length);
  });

  it('writes files to disk', () => {
    for (const entry of imageEntries) {
      expect(fs.existsSync(entry.fullPath)).toBe(true);
    }
  });

  it('creates thumbnails', () => {
    for (const entry of imageEntries) {
      expect(fs.existsSync(entry.thumbnailPath)).toBe(true);
    }
  });

  it('preserves original filename', () => {
    const originalNames = sample_upload_file_paths.map((p) => path.basename(p));
    for (const entry of imageEntries) {
      expect(originalNames).toContain(entry.originalFileName);
    }
  });

  it('uses UUID-based storage name', () => {
    for (const entry of imageEntries) {
      const name = path.basename(entry.fullPath);
      expect(name).toMatch(/^[0-9a-f-]{36}\.[a-zA-Z0-9]+$/);
    }
  });
});
