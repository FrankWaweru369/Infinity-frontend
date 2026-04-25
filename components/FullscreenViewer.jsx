import { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const FullscreenViewer = ({ images = [], onClose }) => {
  const startY = useRef(0);

  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  if (!images.length) return null;

  // Start vertical gesture
  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  // Track ONLY downward swipe
  const handleTouchMove = (e) => {
    if (!isDragging || zoomed) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      setTranslateY(diff);
    }
  };

  // Release gesture
  const handleTouchEnd = () => {
    setIsDragging(false);

    const screenHeight = window.innerHeight;

    if (translateY > screenHeight * 0.25) {
      onClose(); // swipe down closes
    } else {
      setTranslateY(0); // snap back
    }
  };

  return (
    <div
      className="fullscreen-fade"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.95)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          color: "white",
          fontSize: 22,
          zIndex: 10000,
        }}
      >
        ✕
      </button>

      {/* Swipe container (ONLY vertical gesture here) */}
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? "none" : "transform 0.25s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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
                alt={`full-${i}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomed(!zoomed);
                }}
                style={{
                  width: "100%",
                  maxHeight: "90vh",
                  objectFit: zoomed ? "contain" : "cover",
                  transform: zoomed ? "scale(1.4)" : "scale(1)",
                  transition: "transform 0.25s ease",
                  cursor: "zoom-in",
                  userSelect: "none",
                }}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default FullscreenViewer;
