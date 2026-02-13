
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../app/LanguageContext';

const Landing: React.FC = () => {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = [
    { id: 'goods', name: t('goods'), img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800', desc: 'Sustainably sourced campus essentials.' },
    { id: 'academic_materials', name: t('academic_materials'), img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800', desc: 'Verified notes and textbooks.' },
    { id: 'food', name: t('food'), img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800', desc: 'Student-made snacks and meals.' },
    { id: 'course', name: t('course'), img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800', desc: 'Peer-led learning experiences.' }
  ];

  return (
    <div className="bg-savvy-bg dark:bg-savvy-dark transition-colors duration-1000">
      {/* Hero Section */}
      <section className="relative h-screen w-full flex flex-col justify-center items-center overflow-hidden">
        {/* Immersive AAU Background */}
        <div className="absolute inset-0 z-0 scale-105">
          <img 
            src="https://www.aau.edu.et/_next/image?url=%2Fimages%2Fforumbuilding.jpg&w=3840&q=75" 
            className="w-full h-full object-cover opacity-80 dark:opacity-40 grayscale-[20%] dark:grayscale-[50%] transition-transform duration-[10s] hover:scale-110"
            alt="AAU Forum Building"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-savvy-bg/20 via-transparent to-savvy-bg dark:from-savvy-dark/20 dark:to-savvy-dark"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-6xl">
          <div className="reveal flex justify-center mb-10">
            <div className="w-16 h-16 bg-savvy-dark dark:bg-savvy-bg text-savvy-bg dark:text-savvy-dark rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-2xl">ሳ</div>
          </div>
          
          <h1 className="reveal delay-1 font-serif italic text-4xl md:text-6xl text-savvy-dark dark:text-white mb-4 tracking-tight">
            {t('exclusiveMarket')}
          </h1>
          
          <h2 className="reveal delay-2 font-black text-6xl md:text-[9rem] text-savvy-dark dark:text-white leading-[0.85] tracking-tighter uppercase mb-12">
            Campus <br /> <span className="text-savvy-accent italic font-serif lowercase tracking-normal">Commerce</span> <br /> Reimagined.
          </h2>

          <div className="reveal delay-3 flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              to="/auth" 
              className="btn-premium px-12 py-6 rounded-full font-black text-[11px] uppercase tracking-[0.3em] shadow-xl"
            >
              {t('getStarted')}
            </Link>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Trusted by 10k+ AAU Students
            </p>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
           <svg className="w-6 h-6 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
           </svg>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-40 px-6 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="reveal">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-savvy-accent mb-6">Our Philosophy</p>
            <h3 className="font-serif text-5xl md:text-7xl leading-tight text-savvy-dark dark:text-white mb-10">
              Trade with trust. <br /> Powered by students.
            </h3>
            <p className="text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-lg mb-12">
              Discover the unique power and experience of Savvy. Our student ecosystem connects campus essentials from dorm to dorm. No middlemen, just authentic student commerce.
            </p>
            <div className="flex items-center gap-8">
               <div className="text-center">
                 <p className="text-4xl font-black text-savvy-dark dark:text-white">0%</p>
                 <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Buyer Fees</p>
               </div>
               <div className="w-[1px] h-12 bg-gray-200 dark:bg-white/10"></div>
               <div className="text-center">
                 <p className="text-4xl font-black text-savvy-dark dark:text-white">AAU</p>
                 <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Exclusive</p>
               </div>
            </div>
          </div>
          <div className="reveal delay-2 relative">
             <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl rotate-2 transform hover:rotate-0 transition-transform duration-1000">
               <img src="https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover" alt="Student Trading" />
             </div>
             <div className="absolute -bottom-10 -left-10 bg-white dark:bg-savvy-dark p-10 rounded-[3rem] shadow-xl tibico-border max-w-xs hidden sm:block">
                <p className="font-serif italic text-2xl text-savvy-dark dark:text-white mb-4">"The safest way to buy textbooks I've found."</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-savvy-accent">— Senior Engineering Student</p>
             </div>
          </div>
        </div>
      </section>

      {/* Ingredient Style Categories */}
      <section className="py-40 bg-white dark:bg-[#0a0a0a] transition-colors duration-1000">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <h2 className="font-black text-6xl md:text-8xl tracking-tighter text-savvy-dark dark:text-white uppercase leading-[0.85]">
              Our <br /> <span className="text-savvy-accent italic font-serif lowercase tracking-normal">Ingredients.</span>
            </h2>
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.4em] max-w-xs text-right">
              Explore our core campus categories. Each verified for quality and student trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((cat, idx) => (
              <div key={cat.id} className="reveal group" style={{ animationDelay: `${idx * 0.2}s` }}>
                <div className="relative aspect-[3/4] rounded-[3.5rem] overflow-hidden mb-8 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                  <img src={cat.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-savvy-accent mb-2">{cat.id}</h4>
                <h3 className="text-3xl font-black text-savvy-dark dark:text-white mb-4 tracking-tight">{cat.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed text-sm">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-60 flex flex-col items-center text-center px-6">
        <div className="reveal">
          <h2 className="font-black text-6xl md:text-[10rem] text-savvy-dark dark:text-white leading-[0.8] tracking-tighter uppercase mb-16">
            Join the <br /> <span className="text-savvy-accent italic font-serif lowercase tracking-normal">Circle.</span>
          </h2>
          <Link 
            to="/auth" 
            className="btn-premium px-20 py-10 rounded-full font-black text-sm uppercase tracking-[0.4em] shadow-2xl inline-block"
          >
            Start Trading Now
          </Link>
          <div className="mt-16 flex justify-center gap-12 grayscale opacity-40">
             <span className="font-black text-xs uppercase tracking-widest">AAU 6-Kilo</span>
             <span className="font-black text-xs uppercase tracking-widest">AAU 5-Kilo</span>
             <span className="font-black text-xs uppercase tracking-widest">AAU Lideta</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
