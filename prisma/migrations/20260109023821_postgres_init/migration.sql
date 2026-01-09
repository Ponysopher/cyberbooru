-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageGroup" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageTags" (
    "imageId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "ImageTags_pkey" PRIMARY KEY ("imageId","tagId")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagAlias" (
    "id" SERIAL NOT NULL,
    "alias" TEXT NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "TagAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelatedTags" (
    "fromTagId" INTEGER NOT NULL,
    "toTagId" INTEGER NOT NULL,

    CONSTRAINT "RelatedTags_pkey" PRIMARY KEY ("fromTagId","toTagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Image_fullPath_key" ON "Image"("fullPath");

-- CreateIndex
CREATE UNIQUE INDEX "Image_thumbnailPath_key" ON "Image"("thumbnailPath");

-- CreateIndex
CREATE UNIQUE INDEX "Image_largePath_key" ON "Image"("largePath");

-- CreateIndex
CREATE UNIQUE INDEX "Image_sha256Hash_key" ON "Image"("sha256Hash");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TagAlias_alias_key" ON "TagAlias"("alias");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ImageGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageTags" ADD CONSTRAINT "ImageTags_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageTags" ADD CONSTRAINT "ImageTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAlias" ADD CONSTRAINT "TagAlias_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedTags" ADD CONSTRAINT "RelatedTags_fromTagId_fkey" FOREIGN KEY ("fromTagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedTags" ADD CONSTRAINT "RelatedTags_toTagId_fkey" FOREIGN KEY ("toTagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
