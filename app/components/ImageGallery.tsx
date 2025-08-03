import React from 'react'
import ImageCard from './ImageCard'

const ImageGallery = () => {
  const dummySources = [
    "/1.jpeg", "/2.jpeg", "/3.jpeg", "/4.png", "/5.jpeg", "/6.jpeg"
  ]

  return (
    <main className='grid-container w-full p-6
      max-w-screen-xl mx-auto'
    >
      <section 
        className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4
          xl:grid-cols-5 2xl:grid-cols-6 gap-4'
      >
        {dummySources.map((src, idx) => (
          <ImageCard 
            key={`img-${idx}`} 
            src={src}
            tagCount={5}
            // selected
          />
        ))}
      </section>
    </main>
  )
}

export default ImageGallery