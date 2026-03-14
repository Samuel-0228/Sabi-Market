
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../app/LanguageContext';
import { useTheme } from '../../app/ThemeContext';
import { Shield, Star, Lock, Moon, Sun } from 'lucide-react';

const Landing: React.FC = () => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-savvy-surface transition-colors duration-1000 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-[75vh] md:h-screen w-full flex flex-col justify-center items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://www.aau.edu.et/_next/image?url=%2Fimages%2Fforumbuilding.jpg&w=3840&q=75" 
            className="w-full h-full object-cover opacity-60 dark:opacity-20 grayscale-[20%] dark:grayscale-[80%] transition-all duration-1000"
            alt="AAU"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-savvy-surface/40 to-savvy-surface"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl">
          <div className="reveal flex justify-center mb-6 relative">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-savvy-text text-savvy-surface rounded-xl flex items-center justify-center font-black text-lg md:text-2xl shadow-2xl">ሳ</div>
            
            {/* Theme Toggle in Hero */}
            <button 
              onClick={toggleTheme}
              className="absolute -right-12 top-1/2 -translate-y-1/2 p-3 bg-black/5 dark:bg-white/10 backdrop-blur-md rounded-full border border-black/10 dark:border-white/10 hover:scale-110 transition-all"
            >
              {theme === 'light' ? <Moon className="w-4 h-4 text-savvy-dark" /> : <Sun className="w-4 h-4 text-white" />}
            </button>
          </div>
          
          <h2 className="reveal delay-2 font-black text-4xl md:text-8xl text-savvy-text leading-[1.05] md:leading-[0.85] tracking-tighter uppercase mb-6 md:mb-12">
            Campus <br /> <span className="text-savvy-accent italic font-serif lowercase tracking-normal">Trade</span> <br /> Simplified.
          </h2>

          <div className="reveal delay-3 flex flex-col items-center gap-4">
            <Link 
              to="/auth" 
              className="btn-premium w-full sm:w-auto px-10 py-4 md:py-6 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl text-center"
            >
              Enter Market
            </Link>
            <p className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
              AAU Exclusive Node
            </p>
          </div>
        </div>
      </section>

      {/* Essentials Grid - Reduced Space */}
      <section className="py-12 md:py-32 px-4 max-w-[1400px] mx-auto">
        <div className="mb-8 md:mb-12">
           <p className="text-[8px] font-black uppercase tracking-[0.4em] text-savvy-accent mb-2">Inventory</p>
           <h3 className="text-2xl md:text-6xl font-black uppercase tracking-tighter text-savvy-text">Essentials.</h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-8">
          {[
            { id: 'goods', name: t('goods'), img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400' },
            { id: 'academic', name: t('academic_materials'), img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400' },
            { id: 'food', name: t('food'), img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400' },
            { id: 'course', name: t('course'), img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400' }
          ].map((cat) => (
            <div key={cat.id} className="reveal group bg-white dark:bg-white/5 rounded-2xl overflow-hidden tibico-border">
              <div className="aspect-square overflow-hidden">
                <img src={cat.img} className="w-full h-full object-cover" alt={cat.name} referrerPolicy="no-referrer" />
              </div>
              <div className="p-3">
                <p className="text-[9px] font-black text-savvy-text truncate">{cat.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Secure Trading Section */}
      <section className="py-20 md:py-40 bg-black text-white overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="reveal">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-savvy-accent mb-6">Trust & Safety</p>
              <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
                Secure <br /> Trading <br /> <span className="text-savvy-accent italic font-serif lowercase tracking-normal">Escrow.</span>
              </h2>
              <p className="text-white/60 text-lg font-medium leading-relaxed mb-12 max-w-md">
                We protect both buyers and sellers with our integrated escrow service. Funds are only released when the trade is successfully completed.
              </p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-savvy-accent" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-widest text-xs mb-2">Escrow Protection</h4>
                    <p className="text-white/40 text-sm">Your money is held securely until you confirm receipt of the item.</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <Star className="w-6 h-6 text-savvy-accent" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-widest text-xs mb-2">Rating System</h4>
                    <p className="text-white/40 text-sm">Build your reputation with verified reviews from other AAU students.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="reveal delay-2 relative">
              <div className="aspect-square bg-gradient-to-br from-savvy-accent/20 to-transparent rounded-[4rem] border border-white/10 p-8 flex flex-col justify-center items-center text-center">
                <Lock className="w-20 h-20 text-savvy-accent mb-8 animate-pulse" />
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Verified Nodes Only</h3>
                <p className="text-white/50 font-medium">Exclusive to @aau.edu.et email holders. No outsiders, no scams.</p>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-savvy-accent/10 blur-[100px] rounded-full"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-savvy-accent/10 blur-[100px] rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 md:py-40 flex flex-col items-center text-center px-6">
        <div className="reveal max-w-xl">
          <h2 className="font-black text-3xl md:text-7xl text-savvy-text uppercase mb-8 leading-tight">
            Ready to <br /> <span className="text-savvy-accent italic font-serif lowercase tracking-normal">Connect?</span>
          </h2>
          <Link 
            to="/auth" 
            className="btn-premium px-12 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl inline-block w-full sm:w-auto"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
