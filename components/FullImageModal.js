import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

const FullImageModal = ({ imageUrl, onClose }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  // Add Escape key support
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
        aria-label="Close (or press Escape)"
      >
        <div className="flex items-center justify-center w-10 h-10 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70">
          <FiX size={24} />
        </div>
      </button>

      <img
        src={imageUrl}
        alt="Full"
        className={`max-w-full max-h-full transition-transform duration-300 ${
          isZoomed ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setIsZoomed((prev) => !prev);
        }}
      />
    </div>
  );
};

export default FullImageModal;
