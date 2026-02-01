
import React from 'react';
import { useLanguage } from './LanguageContext';

interface LandingProps {
  onGetStarted: () => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
  const { t } = useLanguage();

  return (
    <div className="reveal overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-60 sm:pt-48 sm:pb-80">
        <div className="max-w-[1400px] mx-auto px-10 relative z-10">
          <div className="max-w-5xl">
            <div className="inline-flex items-center gap-3 bg-white/5 border border-indigo-500/20 px-6 py-3 rounded-full mb-12 backdrop-blur animate-in fade-in slide-in-from-left duration-1000">
               <span className="w-2.5 h-2.5 bg-savvy-teal rounded-full animate-pulse"></span>
               <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.3em]">Verified AAU Exclusive</span>
            </div>
            <h1 className="text-7xl sm:text-[9rem] font-black tracking-tighter leading-[0.8] mb-12 animate-in fade-in slide-in-from-bottom duration-1000">
              <span className="text-black dark:text-white block mb-4">Campus Commerce,</span>
              <span className="text-gradient">Reimagined.</span>
            </h1>
            <p className="text-xl sm:text-3xl text-gray-500 dark:text-gray-400 font-medium mb-16 max-w-3xl leading-relaxed">
              The smart, secure, and beautiful marketplace built specifically for Addis Ababa University students.
            </p>
            <div className="flex flex-col sm:flex-row gap-8">
              <button 
                onClick={onGetStarted}
                className="btn-vibrant px-14 py-8 rounded-[2.5rem] text-white font-black text-sm uppercase tracking-[0.2em] shadow-[0_30px_60px_-10px_rgba(99,102,241,0.5)] active:scale-95 transition-all"
              >
                Join the Market
              </button>
              <button className="px-14 py-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-black dark:text-white font-black text-sm uppercase tracking-[0.2em] hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
                Learn Why Savvy
              </button>
            </div>
          </div>
        </div>

        {/* Hopeful Color Blobs */}
        <div className="absolute top-1/4 -right-[10%] w-[50%] h-[70%] bg-indigo-500/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-[10%] w-[30%] h-[40%] bg-pink-500/10 rounded-full blur-[120px] -z-10 delay-700"></div>
        <div className="absolute top-[60%] left-[40%] w-[20%] h-[30%] bg-amber-500/10 rounded-full blur-[100px] -z-10"></div>
      </section>

      {/* Trust Grid */}
      <section className="py-40 border-y border-gray-100 dark:border-white/5 relative bg-gray-50/30 dark:bg-white/2">
        <div className="max-w-[1400px] mx-auto px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { icon: '🛡️', title: 'Safe Escrow', desc: 'No one gets paid until you receive your item. Secure trading for students.', color: 'text-indigo-500' },
              { icon: '🧠', title: 'AI Guided', desc: 'Our Savvy Assistant helps you price, list, and find treasures.', color: 'text-pink-500' },
              { icon: '🏛️', title: 'AAU Only', desc: 'Only verified emails ending in @aau.edu.et can access the market.', color: 'text-amber-500' }
            ].map((f, i) => (
              <div key={i} className="group p-14 bg-white dark:bg-[#0c0c0e] rounded-[4rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:-translate-y-4 transition-all duration-700">
                <div className="text-5xl mb-10 group-hover:scale-110 group-hover:rotate-6 transition-transform">{f.icon}</div>
                <h3 className={`text-3xl font-black mb-6 tracking-tight ${f.color}`}>{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
