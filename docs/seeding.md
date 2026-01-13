# Image Seeding Guide

## Purpose

This document describes how to ingest images from the local filesystem into the Postgres database for Cyberbooru.

Seeding is intended for initial bulk ingestion or testing and is **idempotent**, meaning running the seed multiple times will not create duplicate entries (duplicate images are skipped based on file path and SHA256 hash).

It also generates a summary of inserts, duplicates, and errors.

## Prerequisites

- Node.js 20+ (or the version your project uses)
- Docker & docker-compose installed
- Project cloned and dependencies installed:
  ```
  git clone <repo-url>
  cd cyberbooru
  npm install
  ```
- Postgres DB running (via docker-compose):
  ```
  docker compose up -d db
  ```

## DB Reset Strategies

### 1. Truncate (lightweight)

Clears all rows in the database tables without dropping schema. Useful for routine integration tests.

```
npm db:truncate
```

### 2. Rebuild (clean slate)

Drops & recreates the schema, applies migrations, and reseeds. Useful for running seeds on a fresh environment or for initial setup.

```bash
npm db:rebuild
npm seed
```

Note: `db:rebuild` ensures the database matches the latest Prisma schema.

## 3. DB Reset / Rebuild Options

Explain the two main strategies you have for testing or reseeding.

## 4. Running the Seed

Execute the seed script:

```bash
npm seed
```

Expected output (example):

```
Seed complete:
Total images processed: 25
New images inserted: 25
Duplicates skipped: 0
Errors: 0
Elapsed: 123ms
```

### Idempotency Behavior

Running npm seed a second time:

- No duplicates are inserted
- Summary reflects skipped duplicates

## Directory Structure

Images for seeding are placed in a directory identified by the environment variable `BASE_IMAGES_PATH`

Rules:

- Only image files (`.png`, `.jpg`, `.jpeg`, `.gif`) are processed
- Hidden or system files are ignored
- Directory scanning is **non-recursive by default**; configure `recursive=true` in `scanLocalImages` to include subfolders

## Thumbnail Generation

- Thumbnails are generated alongside original images
- Stored in `/thumbnails` adjacent to the images directory
- Currently only a scaffold exists; full resizing logic to be implemented

## Duplicate Detection

- Duplicates are identified using file path + SHA256 hash
- Perceptual deduplication is not yet implemented

## Local Docker Dev Workflow

Bring up DB:

```
docker compose up -d db
```

Rebuild DB (optional):

```
npm db:rebuild
```

Run seed:

```
npm seed
```

Run tests:

```
pnpm test
```

---

## **8. Notes / Future Work**

```markdown
## Notes

- Seed is append-only
- Large batch uploads will be implemented later
- Thumbnails and near-duplicate detection are planned for future sprints
- This guide assumes images are small and local; no cloud storage integration yet
```
