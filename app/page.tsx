import ImageGallery from "./components/ImageGallery";

export default function Page() {
  return (
    <>    
    <header className="bg-cyber-surface text-cyber-secondary font-sans p-10 flex flex-col gap-2">
      <h1 className="text-4xl">CYBERPUNK GRID TEST</h1>

      <section className="relative">
        <h2 className="px-2 mb-1">Tags</h2>
        <div className="neon-underline">
          <input type="text" 
            className={`border border-cyber-primary rounded-xl
              px-2 w-full outline-none neon-shadow-hover
              transition-shadow duration-200 ease-in-out
            `}
          />
        </div>
      </section>
    </header>

    <ImageGallery />
    </>
  )
}
