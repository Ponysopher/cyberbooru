import ImageCard from './ImageCard';
import { get_image_paths, ImageInfo } from '@/app/data/images';

const IMAGE_LIMIT = 6;

const siteURL =
  process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_BASE_SITE_URL
    : 'http://localhost:3000';
if (!siteURL) throw new Error('BASE_SITE_URL is not defined');
console.log('Site URL:', siteURL);

const ImageGallery = async () => {
  const imageData: ImageInfo[] = await get_image_paths(IMAGE_LIMIT);
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
        {imageData.map(({ thumbnailPath, tags }, idx) => (
          <ImageCard
            key={`img-${idx}`}
            imgPath={thumbnailPath}
            tagCount={tags.length}
            // selected
          />
        ))}
      </section>
    </main>
  );
};

export default ImageGallery;
