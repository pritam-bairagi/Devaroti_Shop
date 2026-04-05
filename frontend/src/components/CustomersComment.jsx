import React, { useMemo } from 'react';
import { Star } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = useMemo(() => [
    {
      name: "Sarah Johnson",
      role: "Fashion Blogger",
      content: "The quality and authenticity of products here is unmatched. My go-to marketplace for premium fashion.",
      rating: 5,
      image: "https://imgs.search.brave.com/nAKGLpZfasDjk6iJYudZO5VYKkMrmynPa0cHFXJRXSU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zMy51/cy1lYXN0LTEuYW1h/em9uYXdzLmNvbS9j/ZG4uZGVzaWduY3Jv/d2QuY29tL2Jsb2cv/eC1tYW4tbG9nb3Mt/Zm9yLWEtc3Ryb25n/LWFuZC1tYXNjdWxp/bmUtYnJhbmRpbmcv/TWFuJTIwTW91c3Rh/Y2hlJTIwQmFyYmVy/c2hvcCUyMGJ5JTIw/Sm9lbWFyLnBuZw"
    },
    {
      name: "Michael Chen",
      role: "Verified Buyer",
      content: "Exceptional customer service and lightning-fast delivery. The product quality exceeded my expectations.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop"
    },
    {
      name: "Emily Rodriguez",
      role: "Interior Designer",
      content: "I've found unique pieces here that I couldn't find anywhere else. Highly recommended for unique finds.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop"
    },
    {
      name: "David Kim",
      role: "Tech Reviewer",
      content: "Amazing selection of premium products. The authentication process gives me peace of mind.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop"
    },
    {
      name: "Lisa Thompson",
      role: "Style Influencer",
      content: "Fast shipping and beautiful packaging. Makes every purchase feel special and luxurious.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop"
    }
  ], []);

  return (
    <section className="py-12 bg-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">
          <span className="text-gray-900">What Our</span>{' '}
          <span className="text-[#f7644f]">Customers Say</span>
        </h2>
        <p className="text-gray-600">Trusted by thousands worldwide</p>
      </div>

      <div className="w-full bg-gray-100 overflow-hidden py-4">
        <div className="flex animate-marquee-reverse whitespace-nowrap">
          {/* First set */}
          {testimonials.map((t, index) => (
            <div key={`first-${index}`} className="inline-block mx-3 w-72 flex-shrink-0">
              <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
                {/* Stars */}
                <div className="flex text-yellow-400 mb-2">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                
                {/* Comment - properly aligned */}
                <p className="text-gray-700 text-sm text-left leading-relaxed mb-3 whitespace-normal">
                  "{t.content}"
                </p>
                
                {/* Profile with View Details */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={t.image}
                      alt={t.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#f7644f]"
                    />
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-xs">{t.name}</p>
                      <p className="text-[10px] text-gray-500">{t.role}</p>
                    </div>
                  </div>
                  
                  {/* View Details Button */}
                  <button className="text-[10px] text-[#f7644f] hover:underline font-medium">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Duplicate set */}
          {testimonials.map((t, index) => (
            <div key={`second-${index}`} className="inline-block mx-3 w-72 flex-shrink-0">
              <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
                <div className="flex text-yellow-400 mb-2">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                
                <p className="text-gray-700 text-sm text-left leading-relaxed mb-3 whitespace-normal">
                  "{t.content}"
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={t.image}
                      alt={t.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#f7644f]"
                    />
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-xs">{t.name}</p>
                      <p className="text-[10px] text-gray-500">{t.role}</p>
                    </div>
                  </div>
                  
                  <button className="text-[10px] text-[#f7644f] hover:underline font-medium">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;