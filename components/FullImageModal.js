import React, { useState } from "react";

const FullImageModal = ({ imageUrl, onClose }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      <img
        src={imageUrl}
        alt="Full"
        className={`max-w-full max-h-full transition-transform duration-300 ${
          isZoomed ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"
        }`}
        onClick={(e) => {
          e.stopPropagation(); // prevents modal from closing when zooming
          setIsZoomed((prev) => !prev);
        }}
      />
    </div>
  );
};

export default FullImageModal;
