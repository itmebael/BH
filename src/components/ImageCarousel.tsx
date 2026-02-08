import React, { useState } from 'react';
import { ImageWithFallback } from './ImageWithFallback';

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
  bucket?: string;
  compact?: boolean; // For constrained spaces like map overlays
  showThumbnails?: boolean; // Control thumbnail visibility
}

export default function ImageCarousel({ images, alt = 'Property image', className = '', bucket = 'property-images', compact = false, showThumbnails = false }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Filter out empty or invalid images
  const validImages = images.filter(img => img && img.trim() !== '');

  if (!validImages || validImages.length === 0) {
    return (
      <div className={`w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-lg ${className}`}>
        <span className="text-gray-500 font-medium">No images available</span>
      </div>
    );
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < validImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? validImages.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === validImages.length - 1 ? 0 : prevIndex + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const isAbsolute = className.includes('absolute');
  
  return (
    <div className={`${isAbsolute ? 'absolute inset-0' : 'relative'} w-full ${className.replace('absolute inset-0', '')}`}>
      {/* Main Image Container */}
      <div 
        className={`${isAbsolute ? 'absolute inset-0' : 'relative'} w-full ${isAbsolute ? '' : compact ? 'h-48 sm:h-56' : 'h-64 sm:h-80 md:h-96'} overflow-hidden rounded-lg bg-gray-100`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Images */}
        <div 
          className="flex transition-transform duration-300 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {validImages.map((image, index) => (
            <div key={index} className="min-w-full h-full relative">
              <ImageWithFallback 
                src={image} 
                alt={`${alt} ${index + 1}`} 
                className="w-full h-full object-cover"
                data-sb-bucket={bucket}
                data-sb-path={image}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        {validImages.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
            {currentIndex + 1} / {validImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {validImages.length > 1 && showThumbnails && !compact && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {validImages.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ImageWithFallback 
                src={image} 
                alt={`${alt} thumbnail ${index + 1}`} 
                className="w-full h-full object-cover"
                data-sb-bucket={bucket}
                data-sb-path={image}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

