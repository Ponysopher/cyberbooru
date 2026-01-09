-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Image" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullPath" TEXT NOT NULL,
    "thumbnailPath" TEXT NOT NULL,
    "largePath" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "fileSizeKB" INTEGER,
    "sha256Hash" TEXT,
    "perceptualHash" TEXT,
    "source" TEXT,
    "nsfw" BOOLEAN NOT NULL DEFAULT true,
    "groupId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Image_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ImageGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Image" ("createdAt", "fileSizeKB", "fullPath", "groupId", "height", "id", "largePath", "nsfw", "perceptualHash", "sha256Hash", "source", "thumbnailPath", "width") SELECT "createdAt", "fileSizeKB", "fullPath", "groupId", "height", "id", "largePath", "nsfw", "perceptualHash", "sha256Hash", "source", "thumbnailPath", "width" FROM "Image";
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";
CREATE UNIQUE INDEX "Image_fullPath_key" ON "Image"("fullPath");
CREATE UNIQUE INDEX "Image_thumbnailPath_key" ON "Image"("thumbnailPath");
CREATE UNIQUE INDEX "Image_largePath_key" ON "Image"("largePath");
CREATE UNIQUE INDEX "Image_sha256Hash_key" ON "Image"("sha256Hash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
