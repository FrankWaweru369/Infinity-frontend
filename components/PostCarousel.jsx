import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const PostCarousel = ({ images = [], onImageClick }) => {
  return(
  <Swiper
    modules={[Navigation, Pagination]}
    navigation
    pagination={{ clickable: true }}
    spaceBetween={10}
    slidesPerView={1}
  >
    {images.map((img, i) => (
      <SwiperSlide key={i}>
        <div className="w-full h-[500px] rounded-2xl bg-gray-100 dark:bg-gray-800 flex justify-center items-center">
          <img
            src={img}
            onClick={(e) => {
              e.stopPropagation();
              onImageClick?.();
            }}
            className="h-full w-auto max-w-full object-contain cursor-pointer rounded-2xl"
          />
        </div>
      </SwiperSlide>
    ))}
  </Swiper>
); 
};

export default PostCarousel;
