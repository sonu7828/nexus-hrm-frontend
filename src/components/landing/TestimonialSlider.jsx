import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    role: 'HR Director',
    company: 'TechFlow Solutions',
    image: 'https://i.pravatar.cc/150?img=1',
    content: 'Nexus HRM Pro transformed our attendance and payroll system completely. The face recognition feature alone saved us hours of manual data entry each week.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Rajiv Sharma',
    role: 'Operations Manager',
    company: 'Global Retail Group',
    image: 'https://i.pravatar.cc/150?img=11',
    content: 'The dashboard is incredibly intuitive. We managed to onboard 500+ employees in just two days. The real-time attendance analytics are a game changer for our managers.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Emily Chen',
    role: 'CEO',
    company: 'Innovate Digital',
    image: 'https://i.pravatar.cc/150?img=5',
    content: 'We switched from a legacy system to Nexus HRM Pro and haven\'t looked back. The automated payroll calculation is flawless and their customer support is top-notch.',
    rating: 5,
  },
];

const TestimonialSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextTestimonial = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prevTestimonial = () => setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2"></div>
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-secondary-light font-semibold tracking-wide uppercase text-xs mb-5 backdrop-blur-md">
              Customer Success
            </div>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-white mb-6">Trusted by Industry Leaders</h3>
          </motion.div>
        </div>

        <div className="max-w-4xl mx-auto relative">
          {/* Navigation Buttons */}
          <div className="absolute top-1/2 -left-4 md:-left-12 -translate-y-1/2 z-20">
            <button onClick={prevTestimonial} className="w-12 h-12 rounded-full bg-navy-dark border border-white/10 shadow-glass flex items-center justify-center text-slate-400 hover:text-white hover:border-primary-light transition-all duration-300 hover:scale-110">
              <ChevronLeft size={24} />
            </button>
          </div>
          
          <div className="absolute top-1/2 -right-4 md:-right-12 -translate-y-1/2 z-20">
            <button onClick={nextTestimonial} className="w-12 h-12 rounded-full bg-navy-dark border border-white/10 shadow-glass flex items-center justify-center text-slate-400 hover:text-white hover:primary-light transition-all duration-300 hover:scale-110">
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="overflow-hidden p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="glass-card-dark p-8 md:p-12 relative overflow-hidden"
              >
                <Quote size={120} className="absolute -top-6 -right-6 text-white/5 rotate-12" />
                
                <div className="flex gap-1 mb-8 relative z-10">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star key={i} size={22} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                  ))}
                </div>
                
                <p className="text-xl md:text-3xl text-slate-200 font-sans font-medium italic mb-10 leading-relaxed relative z-10">
                  "{testimonials[currentIndex].content}"
                </p>
                
                <div className="flex items-center gap-5 relative z-10">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary rounded-full blur-md opacity-50"></div>
                    <img src={testimonials[currentIndex].image} alt={testimonials[currentIndex].name} className="w-16 h-16 rounded-full object-cover border-2 border-white/20 relative z-10" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xl">{testimonials[currentIndex].name}</h4>
                    <p className="text-slate-400 text-sm">{testimonials[currentIndex].role}, <span className="font-semibold text-primary-light drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]">{testimonials[currentIndex].company}</span></p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Pagination Dots */}
          <div className="flex justify-center gap-3 mt-8">
            {testimonials.map((_, idx) => (
               <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-10 bg-primary shadow-[0_0_10px_rgba(37,99,235,0.8)]' : 'w-2 bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSlider;
