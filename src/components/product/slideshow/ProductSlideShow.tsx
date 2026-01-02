'use client'

import React, { useState } from 'react';
import { Swiper as SwiperObject } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

import './slideshow.css';

// import required modules
import { Autoplay, FreeMode, Navigation, Thumbs } from 'swiper/modules';
import Image from 'next/image';
import { ImageModal } from './ImageModal';

interface Props {
    images: string[];
    title: string;
    slug: string;
    className?: string;
}

export const ProductSlideShow = ({images, title, slug, className}: Props) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperObject>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const handleNext = () => {
    if (selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  return (
    <>
    <div className={className}>
        <Swiper
        style={{
          '--swiper-navigation-color': '#fff',
          '--swiper-pagination-color': '#fff',
        } as React.CSSProperties}
        spaceBetween={10}
        navigation={true}
        autoplay={{ delay: 2500 }}
        thumbs={{ swiper: thumbsSwiper }}
        modules={[FreeMode, Navigation, Thumbs, Autoplay]}
        className="mySwiper2"
      >
          {
            images.map((image, index) => (
                <SwiperSlide key={image}>
                    <div 
                      className="cursor-pointer"
                      onClick={() => handleImageClick(index)}
                    >
                      <Image
                          key={index}
                          alt={title}
                          src={image.startsWith('http') || image.startsWith('https') ? image : `/products/${image}`}
                          width={600}
                          height={500}
                          className='rounded-lg object-contain w-full h-full'
                          style={{ viewTransitionName: `product-image-${slug}` }}
                      />
                    </div>
                </SwiperSlide>
            ))
          }
      </Swiper>
      <Swiper
        onSwiper={setThumbsSwiper}
        spaceBetween={10}
        slidesPerView={4}
        freeMode={true}
        watchSlidesProgress={true}
        modules={[FreeMode, Navigation, Thumbs]}
        className="mySwiper"
      >
        {
            images.map((image, index) => (
                <SwiperSlide key={image}>
                    <div 
                      className="cursor-pointer"
                      onClick={() => handleImageClick(index)}
                    >
                      <Image
                          key={index}
                          alt={title}
                          src={image.startsWith('http') || image.startsWith('https') ? image : `/products/${image}`}
                          width={150}
                          height={150}
                          className='rounded-lg object-contain w-full h-full'
                      />
                    </div>
                </SwiperSlide>
            ))
            }
      </Swiper>
    </div>

    <ImageModal
      isOpen={isModalOpen}
      images={images}
      currentIndex={selectedImageIndex}
      title={title}
      onClose={() => setIsModalOpen(false)}
      onNext={handleNext}
      onPrevious={handlePrevious}
    />
    </>
  );
};
