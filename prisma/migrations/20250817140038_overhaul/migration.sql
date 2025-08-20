/*
  Warnings:

  - You are about to drop the column `filePath` on the `Image` table. All the data in the column will be lost.
  - Added the required column `fullPath` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnailPath` to the `Image` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ImageGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TagAlias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alias" TEXT NOT NULL,
    "tagId" INTEGER NOT NULL,
    CONSTRAINT "TagAlias_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RelatedTags" (
    "fromTagId" INTEGER NOT NULL,
    "toTagId" INTEGER NOT NULL,

    PRIMARY KEY ("fromTagId", "toTagId"),
    CONSTRAINT "RelatedTags_fromTagId_fkey" FOREIGN KEY ("fromTagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RelatedTags_toTagId_fkey" FOREIGN KEY ("toTagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "nsfw" BOOLEAN NOT NULL DEFAULT false,
    "groupId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Image_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ImageGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Image" ("createdAt", "id") SELECT "createdAt", "id" FROM "Image";
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";
CREATE UNIQUE INDEX "Image_fullPath_key" ON "Image"("fullPath");
CREATE UNIQUE INDEX "Image_thumbnailPath_key" ON "Image"("thumbnailPath");
CREATE UNIQUE INDEX "Image_largePath_key" ON "Image"("largePath");
CREATE UNIQUE INDEX "Image_sha256Hash_key" ON "Image"("sha256Hash");
CREATE TABLE "new_ImageTags" (
    "imageId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    PRIMARY KEY ("imageId", "tagId"),
    CONSTRAINT "ImageTags_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImageTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ImageTags" ("imageId", "tagId") SELECT "imageId", "tagId" FROM "ImageTags";
DROP TABLE "ImageTags";
ALTER TABLE "new_ImageTags" RENAME TO "ImageTags";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TagAlias_alias_key" ON "TagAlias"("alias");
