import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const PostCarousel = ({ images = [], onImageClick }) => {
  return (
    <Swiper
      modules={[Navigation, Pagination]}
      navigation
      pagination={{ clickable: true }}
      spaceBetween={10}
      slidesPerView={1}
    >
      {images.map((img, i) => (
        <SwiperSlide key={i}>

         <div
  className="w-full aspect-[3/4]
             overflow-hidden rounded-2xl
             bg-gray-100 dark:bg-gray-800"
>
  <img
    src={img}
    onClick={(e) => {
      e.stopPropagation();
      onImageClick?.();
    }}
    className="w-full h-full object-cover object-top cursor-pointer"
  />
</div> 

        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default PostCarousel;
