import React, { useEffect, useState } from "react";

const images = [
  "slide/000.png",
  "slide/111.jpg",
  "slide/222.png",
  "slide/333.png",
  "slide/444.png",
  "slide/555.png",
  "slide/666.png",
  "slide/777.png",
  "slide/888.png",
  "slide/999.png",
];

const ImageSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto slide (smooth like GIF)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.slider,
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {images.map((img, index) => (
          <img key={index} src={img} alt="slide" style={styles.image} />
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "400px",
    height: "600px",
    overflow: "hidden",
    margin: "auto",
  },
  slider: {
    display: "flex",
    width: "100%",
    height: "100%",
    transition: "transform 0.8s ease-in-out",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    flexShrink: 0,
  },
};

export default ImageSlider;