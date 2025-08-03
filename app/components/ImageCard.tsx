"use client"
import Image from 'next/image';
import { CheckSquare, Square, Tag } from 'lucide-react';

interface ImageCardProps {
  src: string;
  selected?: boolean;         // is this image currently batch‐selected?
  onToggleSelect?: () => void;// callback when user toggles selection
  tagCount?: number;          // how many tags already applied?
  // onClick?: () => void;       // optional click (e.g. open modal)
}

export default function ImageCard({
  src,
  selected = false,
  onToggleSelect,
  tagCount = 0,
  // onClick, // Let's style the modal at a later step
}: ImageCardProps) {
  return (
    <article 
      className="group relative aspect-square rounded-md
      overflow-hidden border neon-shadow-hover 
      transition-shadow duration-200 ease-in-out
      hover:border-2 hover:scale-105 transform scale"
    >
      {/* The image */}
      <Image src={src} alt="Failed to load image"
        fill 
        className="object-cover"
      />

      {/* Hover overlay (hidden by default) */}
      <div 
        className={`
          absolute inset-0 p-2 flex flex-col justify-between
          transition-all duration-300 ease-in-out transform
          ${selected 
            ? "opacity-100 translate-y-0" 
            : `opacity-0 translate-y-2 group-hover:opacity-100 
              group-hover:translate-y-0`
          }
        `}
      >
        {/* top-left: checkbox */}
        <button 
          onClick={onToggleSelect}
          // className={selected ? "ring" : ""}
        >
          {/* show a checked or square icon based on `selected` */}
          {selected ? 
            <CheckSquare className='shadow-[0_0_20px] shadow-cyber-purple'/> 
            : <Square />}
        </button>

        {/* bottom-right: tag count */}
        <div className="flex items-center gap-1">
          <Tag size={16} />
          <span>{tagCount}</span>
        </div>
      </div>
    </article>
  );
}
