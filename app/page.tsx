import clsx from 'clsx';
import FileUploader from './components/FileUploader';
import ImageGallery from './components/ImageGallery';
import { ModeToggle } from './components/theme-toggle';

export default function Page() {
  return (
    <>
      <header className="bg-background text-primary p-10 flex flex-col gap-2">
        <div className="width-full flex justify-between items-center">
          <h1 className="text-4xl">CYBERPUNK GRID TEST</h1>
          <ModeToggle />
          <FileUploader></FileUploader>
        </div>

        <section className="relative">
          <h2 className="px-2 mb-1">Tags</h2>
          <div className="neon-underline-animated">
            <input
              type="text"
              className={clsx(
                'border border-ring rounded-xl',
                'px-2 w-full outline-none neon-shadow-hover',
                'transition-shadow duration-200 ease-in-out',
              )}
            />
          </div>
        </section>
      </header>

      <ImageGallery />
    </>
  );
}
