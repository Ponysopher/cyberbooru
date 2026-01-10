import fs from "fs/promises"
import { existsSync } from "fs"
import path from "path";
import sharp from "sharp";
import crypto from "crypto"
import os from "os"
// import { PrismaClient } from "#prisma/index.js";
import { ImageData } from "./migration-types";

interface PriorImageData {
  image_path: string;
  tags: {
    name: string,
    probability: number
  }[];
}

const BASE_PATH = process.env.BASE_IMAGES_PATH || path.join(os.homedir(), "Pictures")
const THUMBNAILS_DIRECTORY = path.join(BASE_PATH, "thumbnails")
const IMAGES_START_PATH = 'Pictures';

// Function for getting metadata
async function get_image_dimensions(filePath: string) {
  const metadata = await sharp(filePath).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    size: metadata.size
  }
}

// Function for creating thumbnails
async function create_thumbnail(filePath: string, width: number, height: number) {
  const newFilename = crypto.randomUUID().toString();
  const newFilePath = path.join(THUMBNAILS_DIRECTORY, newFilename);
  await sharp(filePath).resize(width, height, { fit: "inside" }).toFile(newFilePath);
  return newFilePath;
}

async function main() {
  // import data from file
  const image_pull_file = "./data.json";
  const imagePullBinary = await fs.readFile(image_pull_file, { encoding: "utf-8" });
  const priorImageData: PriorImageData[] = JSON.parse(imagePullBinary);
  if (!priorImageData.length) {
    console.warn("No new images found to import.")
    return 0
  }

  // create thumbnails diretcory if it doesn't exist
  if (!existsSync(THUMBNAILS_DIRECTORY)) {
    fs.mkdir(THUMBNAILS_DIRECTORY, {recursive: true})
  }

  // Generate thumbnails for each image and get their metadata in an imageData array
  const imageData: ImageData[] = []
  const image_worker = async (jsonObject: PriorImageData) => {
    // replace the base path with a new one
    let fullFilePath = jsonObject.image_path;
    fullFilePath = path.join(
      BASE_PATH,
      fullFilePath.slice(fullFilePath.indexOf(IMAGES_START_PATH) + IMAGES_START_PATH.length)
    )
    const [newObj, thumbnailPath] = await Promise.all([
      get_image_dimensions(fullFilePath),
      create_thumbnail(fullFilePath, 250, 250)
    ]);
    imageData.push({
      ...newObj,
      tags: jsonObject.tags.map(tags => tags.name),
      fullPath: fullFilePath,
      thumbnailPath: thumbnailPath
    });
  }

  // Process images in chunks
  const IMAGE_WORKER_CHUNK_SIZE = 500;
  for (let arrayIndex = 0; arrayIndex < priorImageData.length; arrayIndex += IMAGE_WORKER_CHUNK_SIZE) {
    const chunk = priorImageData.slice(arrayIndex, arrayIndex + 500);
    
    console.log(`Now processing ${IMAGE_WORKER_CHUNK_SIZE} images from index ${arrayIndex} of ${priorImageData.length}`);
    await Promise.all(chunk.map(job => image_worker(job)));
  }

  return 0
}

//TODO: NEED TO ACTUALLY ADD ROWS TO DATABASE
main();