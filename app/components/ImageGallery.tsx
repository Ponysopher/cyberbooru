import ImageCard from './ImageCard';
import { get_image_paths } from '@/app/data/images';

const IMAGE_LIMIT = 6;

const ImageGallery = async () => {
  const imageData = await get_image_paths(IMAGE_LIMIT);
  console.log('Fetched image data:', imageData);

  return (
    <main className="grid-container w-full p-6 max-w-7xl mx-auto">
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {imageData.map(({ thumbnailPath, ImageTags }, idx) => (
          <ImageCard
            key={`img-${idx}`}
            imgPath={thumbnailPath}
            tagCount={ImageTags.length}
          />
        ))}
      </section>
    </main>
  );
};

export default ImageGallery;
