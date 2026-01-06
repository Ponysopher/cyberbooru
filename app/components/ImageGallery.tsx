import React from 'react';
import ImageCard from './ImageCard';
import { ImageInfo } from '@/app/data/images';

const siteURL =
  process.env.NODE_ENV === 'production'
    ? process.env.BASE_SITE_URL
    : 'http://localhost:3000';
console.log('Site URL:', siteURL);

const ImageGallery = async () => {
  const imageResponse = await fetch(`${siteURL}/api/images?limit=6`);
  const imageData: ImageInfo[] = await imageResponse.json();
  console.log('Fetched image data:', imageData);

  return (
    <main
      className="grid-container w-full p-6
      max-w-screen-xl mx-auto"
    >
      <section
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4
          xl:grid-cols-5 2xl:grid-cols-6 gap-4"
      >
        {imageData.map(({ filePath, tags }, idx) => (
          <ImageCard
            key={`img-${idx}`}
            imgPath={filePath}
            tagCount={tags.length}
            // selected
          />
        ))}
      </section>
    </main>
  );
};

export default ImageGallery;
