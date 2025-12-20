'use client'

import { useState } from 'react'
import Image from 'next/image'
import ImageGallery from './ImageGallery'
import { ZoomIn } from 'lucide-react'

interface ListingImageGalleryProps {
  images: Array<{ id: string; url: string }>
  title: string
}

export function ListingImageGallery({ images, title }: ListingImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (images.length === 0) {
    return null
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image - Premium Framed */}
        <div
          className="aspect-square overflow-hidden bg-gradient-to-br from-muted/40 via-muted/20 to-muted/40 rounded-xl relative group cursor-pointer border border-border/20"
          onClick={() => setSelectedIndex(currentIndex)}
        >
          <Image
            src={images[currentIndex].url}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            priority
          />
          {/* Premium Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {/* Zoom Indicator */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
              <ZoomIn className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Thumbnail Strip - Premium */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`aspect-square overflow-hidden bg-gradient-to-br from-muted/40 via-muted/20 to-muted/40 rounded-lg relative group cursor-pointer border-2 transition-all duration-300 ${
                  index === currentIndex
                    ? 'border-primary/60 ring-2 ring-primary/20 shadow-lg shadow-primary/10'
                    : 'border-border/30 hover:border-primary/40'
                }`}
                onClick={() => {
                  setCurrentIndex(index)
                  setSelectedIndex(index)
                }}
              >
                <Image
                  src={image.url}
                  alt={`${title} - ${index + 1}`}
                  fill
                  sizes="(max-width: 1024px) 25vw, 15vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {index === currentIndex && (
                  <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Gallery */}
      {selectedIndex !== null && (
        <ImageGallery
          images={images}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  )
}

export default ListingImageGallery

