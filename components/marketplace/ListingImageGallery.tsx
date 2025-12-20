'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageGallery } from './ImageGallery'
import { ZoomIn } from 'lucide-react'

interface ListingImageGalleryProps {
  images: Array<{ id: string; url: string }>
  title: string
}

export function ListingImageGallery({ images, title }: ListingImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (images.length === 0) {
    return null
  }

  return (
    <>
      <div className="space-y-2 sm:space-y-3">
        {/* Main Image - Büyütüldü */}
        <div
          className="aspect-square rounded-lg overflow-hidden bg-muted relative group cursor-pointer w-full"
          onClick={() => setSelectedIndex(0)}
        >
          <Image
            src={images[0].url}
            alt={title}
            width={600}
            height={600}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn className="h-6 w-6 sm:h-8 sm:w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Thumbnail Grid - Kompakt */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {images.slice(1).map((image, index) => (
              <div
                key={image.id}
                className="aspect-square rounded-lg overflow-hidden bg-muted relative group cursor-pointer"
                onClick={() => setSelectedIndex(index + 1)}
              >
                <Image
                  src={image.url}
                  alt={`${title} - ${index + 2}`}
                  width={150}
                  height={150}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
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

