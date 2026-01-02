'use client'

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';

import './slideshow.css';

// import required modules
import { Autoplay, FreeMode, Pagination } from 'swiper/modules';
import Image from 'next/image';
import { ImageModal } from './ImageModal';

interface Props {
    images: string[];
    title: string;
    slug: string;
    className?: string;
}

export const ProductMobileSlideShow = ({images, title, slug, className}: Props) => {
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
        pagination={true}
        autoplay={{ delay: 2500 }}
        modules={[FreeMode, Pagination, Autoplay]}
        className="mySwiper2"
        style={{
          width: '100%',
          height: '400px'
        }}
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
                          height={400}
                          className='object-contain w-full h-full'
                          style={{ viewTransitionName: `product-image-${slug}` }}
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
