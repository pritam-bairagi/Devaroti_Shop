import React from "react";
import { Headset, Languages } from "lucide-react";

const HeaderTop = () => {
  return (
    <header className="w-full pt-1 bg-[#E3E6F3] z-[100] shadow-md">
      <div className="max-w-7xl mx-auto flex flex-nowrap items-center justify-between px-3 py-2 gap-2">

        {/* Phone */}
        <div className="flex items-center text-sm text-gray-600 whitespace-nowrap">
          <a href="tel:+8801883558258" className="flex hover:text-black gap-2 items-center">
            <Headset size={20} />
            <span className="hidden sm:inline">+880 18835 58258</span>
          </a>
        </div>

        {/* Marquee */}
        <div className="flex-1 min-w-0 overflow-hidden relative h-5">
          <div className="absolute whitespace-nowrap animate-marquee uppercase text-red-500">
            ⚠️ এই সাইট টির কাজ চলমান। খুব শীগ্রেই প্রকাশ করা হবে। সাইটটি সম্পূর্ণভাবে ডিজাইন / ডেভেলপ / নিয়ন্ত্রন করছেন <b>পৃতম বৈরাগী</b> । সার্বিক যোগাযোগ : +8801883558258 । ধন্যবাদ। ⚠️
          </div>
        </div>
{/* Currency / Language */}
<div className="flex items-center gap-1 text-sm text-gray-500 whitespace-nowrap">

  {/* Currency */}
  <div className="flex items-center">
    
    {/* Mobile icon */}
    <span className="sm:hidden text-[14px] bg-gray-100 px-2 py-0.5 rounded">৳</span>

    {/* Desktop select */}
    <select className="hidden sm:block bg-transparent outline-none cursor-pointer border border-gray-300 rounded px-1 py-0.5">
      <option value="bdt">BDT ৳</option>
      <option value="usd">USD $</option>
      <option value="rupee">Rupee ₹</option>
    </select>

  </div>

  {/* Language */}
  <div className="flex items-center">

    {/* Mobile icon */}
    <Languages className="sm:hidden bg-gray-100 p-1 rounded" size={24} />

    {/* Desktop select */}
    <select className="hidden sm:block bg-transparent outline-none cursor-pointer border border-gray-300 rounded px-1 py-0.5">
      <option value="en-US">English</option>
      <option value="bn">Bangla</option>
      <option value="hi">Hindi</option>
    </select>

  </div>

          <div className="flex items-center bg-gray-100 px-1 rounded gap-1">
            <img
              src="https://flagpedia.net/data/flags/emoji/twitter/256x256/bd.png"
              alt="BD"
              className="w-4 h-4"
            />
            <p>🇧🇩</p>
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
      `}</style>
    </header>
  );
};

export default HeaderTop;