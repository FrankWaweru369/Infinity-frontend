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
          <img
            src={img}
            onClick={(e) => {
              e.stopPropagation();
              onImageClick?.();
            }}
            style={{
              width: "100%",
              objectFit: "cover",
              cursor: "pointer",
            }}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default PostCarousel;
