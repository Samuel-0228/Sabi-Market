
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../app/LanguageContext';

const Landing: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-savvy-bg dark:bg-savvy-dark transition-colors duration-1000 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-[85vh] md:h-screen w-full flex flex-col justify-center items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://www.aau.edu.et/_next/image?url=%2Fimages%2Fforumbuilding.jpg&w=3840&q=75" 
            className="w-full h-full object-cover opacity-60 dark:opacity-30 grayscale-[20%] transition-transform duration-[10s]"
            alt="AAU"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-savvy-bg/40 to-savvy-bg dark:via-savvy-dark/40 dark:to-savvy-dark"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl">
          <div className="reveal flex justify-center mb-6 md:mb-10">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-savvy-dark dark:bg-savvy-bg text-savvy-bg dark:text-savvy-dark rounded-xl md:rounded-[1.5rem] flex items-center justify-center font-black text-xl md:text-2xl shadow-2xl">ሳ</div>
          </div>
          
          <h2 className="reveal delay-2 font-black text-4xl md:text-8xl text-savvy-dark dark:text-white leading-[1.1] md:leading-[0.85] tracking-tighter uppercase mb-8 md:mb-12">
            Campus <br /> <span className="text-savvy-accent italic font-serif lowercase tracking-normal">Commerce</span> <br /> Simplified.
          </h2>

          <div className="reveal delay-3 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/auth" 
              className="btn-premium w-full sm:w-auto px-10 py-4 md:py-6 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl text-center"
            >
              {t('getStarted')}
            </Link>
            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
              Exclusive to AAU Students
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid (AliExpress Style) */}
      <section className="py-12 md:py-32 px-4 max-w-[1400px] mx-auto">
        <div className="mb-12">
           <p className="text-[8px] font-black uppercase tracking-[0.4em] text-savvy-accent mb-2">Inventory</p>
           <h3 className="text-3xl md:text-6xl font-black uppercase tracking-tighter dark:text-white">The Essentials.</h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
          {[
            { id: 'goods', name: t('goods'), img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400' },
            { id: 'academic', name: t('academic_materials'), img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400' },
            { id: 'food', name: t('food'), img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400' },
            { id: 'course', name: t('course'), img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400' }
          ].map((cat) => (
            <div key={cat.id} className="reveal group bg-white dark:bg-white/5 rounded-3xl overflow-hidden tibico-border shadow-sm">
              <div className="aspect-[4/5] overflow-hidden">
                <img src={cat.img} className="w-full h-full object-cover" alt={cat.name} />
              </div>
              <div className="p-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-savvy-accent mb-1">{cat.id}</h4>
                <p className="text-xs font-bold dark:text-white truncate">{cat.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mobile-Friendly CTA */}
      <section className="py-20 md:py-40 flex flex-col items-center text-center px-4 bg-white dark:bg-white/2">
        <div className="reveal max-w-xl">
          <h2 className="font-black text-4xl md:text-7xl text-savvy-dark dark:text-white leading-tight uppercase mb-8">
            Ready to <br /> <span className="text-savvy-accent italic font-serif lowercase tracking-normal">Trade?</span>
          </h2>
          <Link 
            to="/auth" 
            className="btn-premium px-12 py-5 rounded-full font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl inline-block w-full sm:w-auto"
          >
            Start Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
