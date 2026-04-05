import React, { useState, useEffect } from 'react';

const SimpleResponsiveSlideshow = () => {
  const [slideIndex, setSlideIndex] = useState(1);
  
  const slides = [
    {
      id: 1,
      imgSrc: "1.avif",
      alt: "Nature",
      caption: "French Alps"
    },
    {
      id: 2,
      imgSrc: "2.avif",
      alt: "Snow",
      caption: "Northern Lights"
    },
    {
      id: 3,
      imgSrc: "3.avif",
      alt: "Mountains",
      caption: "Beautiful Mountains"
    },
    {
      id: 4,
      imgSrc: "4.avif",
      alt: "Forest",
      caption: "The Rain Forest"
    },
    {
      id: 5,
      imgSrc: "5.avif",
      alt: "More Mountains",
      caption: "Mountains!"
    }
  ];

  // Auto-play effect
  useEffect(() => {
    const interval = setInterval(() => {
      plusDivs(1);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [slideIndex]);

  const plusDivs = (n) => {
    let newIndex = slideIndex + n;
    if (newIndex > slides.length) newIndex = 1;
    if (newIndex < 1) newIndex = slides.length;
    setSlideIndex(newIndex);
  };

  const currentDiv = (n) => {
    setSlideIndex(n);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-3">
      {/* Main slideshow container */}
      <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden shadow-lg">
        {/* Slides container - responsive height */}
        <div className="relative w-full" style={{ paddingBottom: '40%' }}> {/* 16:9 aspect ratio */}
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                slideIndex === index + 1 
                  ? 'opacity-100 translate-x-0' 
                  : slideIndex < index + 1 
                    ? 'opacity-0 translate-x-full' 
                    : 'opacity-0 -translate-x-full'
              }`}
            >
              <img
                src={slide.imgSrc}
                alt={slide.alt}
                className="absolute w-full h-full object-cover"
              />
              
              {/* Simple caption at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 sm:p-4">
                <p className="text-sm sm:text-base md:text-lg text-center">
                  {slide.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Previous button - responsive sizing */}
        <button
          onClick={() => plusDivs(-1)}
          className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 
            bg-black bg-opacity-50 hover:bg-opacity-70 text-white 
            w-8 h-8 sm:w-10 sm:h-10 rounded-full 
            flex items-center justify-center
            text-lg sm:text-xl
            transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-white
            z-10"
        >
          &#10094;
        </button>
        
        {/* Next button */}
        <button
          onClick={() => plusDivs(1)}
          className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 
            bg-black bg-opacity-50 hover:bg-opacity-70 text-white 
            w-8 h-8 sm:w-10 sm:h-10 rounded-full 
            flex items-center justify-center
            text-lg sm:text-xl
            transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-white
            z-10"
        >
          &#10095;
        </button>

        {/* Bottom dots navigation - responsive spacing */}
        <div className="absolute bottom-12 sm:bottom-16 left-1/2 transform -translate-x-1/2 
          flex space-x-1 sm:space-x-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => currentDiv(index + 1)}
              className={`
                rounded-full transition-all duration-300 
                focus:outline-none focus:ring-2 focus:ring-white
                ${slideIndex === index + 1 
                  ? 'bg-white w-4 sm:w-6 h-1.5 sm:h-2' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75 w-1.5 sm:w-2 h-1.5 sm:h-2'
                }
              `}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleResponsiveSlideshow;