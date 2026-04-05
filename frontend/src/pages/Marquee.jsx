  import React, { useRef, useEffect } from "react";

  const Marquee = () => {
    const scrollRef = useRef(null);
    const animationRef = useRef(null);

    const isDown = useRef(false);
    const startX = useRef(0);
    const scrollStart = useRef(0);

    const images = [
      "https://static.vecteezy.com/system/resources/thumbnails/019/766/240/small/amazon-logo-amazon-icon-transparent-free-png.png",
      "https://upload.wikimedia.org/wikipedia/commons/5/5b/Daraz_Logo.png",
      "https://blog.cartup.com/wp-content/uploads/2024/12/Untitled-1.png",
      "https://ae01.alicdn.com/kf/Sa0202ec8a96a4085962acfc27e9ffd04F/1080x1080.jpg",
      "https://diplo-media.s3.eu-central-1.amazonaws.com/2024/09/227dd295-99df-4f13-86b8-767b17c69c04-1024x387.png",
      "https://corporate.bdjobs.com/logos/38428_2.png",
      "https://storage.googleapis.com/bdjobs/CompanyLogos/Hotjobs/201_300x300_bdjobslogo300-min.png",
      "https://upload.wikimedia.org/wikipedia/commons/8/84/Government_Seal_of_Bangladesh.svg",
      "https://play-lh.googleusercontent.com/KCMTYuiTrKom4Vyf0G4foetVOwhKWzNbHWumV73IXexAIy5TTgZipL52WTt8ICL-oIo",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Logo_of_YouTube_%282015-2017%29.svg/960px-Logo_of_YouTube_%282015-2017%29.svg.png",
    ];

    const loopImages = [...images, ...images];

    // AUTO SCROLL
    useEffect(() => {
      const el = scrollRef.current;
      const speed = 4; // Adjust this value to change the speed of the marquee

      const animate = () => {
        if (!isDown.current) {
          el.scrollLeft += speed;
        }

        const half = el.scrollWidth / 2;

        if (el.scrollLeft >= half) {
          el.scrollLeft -= half;
        }

        if (el.scrollLeft <= 0) {
          el.scrollLeft += half;
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => cancelAnimationFrame(animationRef.current);
    }, []);

    // DRAG START
    const handleMouseDown = (e) => {
      const el = scrollRef.current;

      isDown.current = true;
      startX.current = e.pageX;
      scrollStart.current = el.scrollLeft;
    };

    // DRAG END
    const stopDrag = () => {
      isDown.current = false;
    };

    // DRAG MOVE
    const handleMouseMove = (e) => {
      if (!isDown.current) return;

      const el = scrollRef.current;

      const walk = (e.pageX - startX.current) * 2;
      el.scrollLeft = scrollStart.current - walk;
    };

    return (
      
      <div className="w-full py-8 border-t border-gray-600 overflow-hidden select-none">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">
            <span className="text-gray-900">Our</span>{' '}
            <span className="text-[#ff5500]">Valuable Partners</span>
          </h2>
          <p className="text-gray-600">Trusted Seller & Brands</p>
        </div>
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onMouseMove={handleMouseMove}
          className="flex overflow-x-scroll no-scrollbar cursor-grab active:cursor-grabbing"
        >
          <div className="flex gap-20 items-center">
            {loopImages.map((src, i) => (
              <div key={i} className="flex-shrink-0 h-20">
                <img
                  src={src}
                  className="h-full object-contain opacity-50 pointer-events-none"
                  alt="Our valuable partner"
                />
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    );
  };

  export default Marquee;