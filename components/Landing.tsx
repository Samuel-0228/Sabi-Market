
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
      <section className="relative pt-32 pb-64 sm:pt-48 sm:pb-80">
        <div className="max-w-[1400px] mx-auto px-10 relative z-10">
          <div className="max-w-5xl">
            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 px-6 py-3 rounded-full mb-12 backdrop-blur-xl animate-in fade-in slide-in-from-left duration-1000">
               <span className="w-2.5 h-2.5 bg-savvy-teal rounded-full animate-ping"></span>
               <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-[0.4em]">{t('exclusiveMarket')}</span>
            </div>
            <h1 className="text-7xl sm:text-[9.5rem] font-black tracking-tighter leading-[0.8] mb-14 animate-in fade-in slide-in-from-bottom duration-1000">
              <span className="text-black dark:text-white block mb-6">Campus Life,</span>
              <span className="text-gradient-hope">Simplified.</span>
            </h1>
            <p className="text-xl sm:text-3xl text-gray-500 dark:text-gray-400 font-medium mb-20 max-w-3xl leading-relaxed">
              {t('landingSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-8">
              <button 
                onClick={onGetStarted}
                className="btn-hope px-16 py-8 rounded-[3rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
              >
                {t('getStarted')}
              </button>
              <button className="px-16 py-8 rounded-[3rem] bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white font-black text-sm uppercase tracking-[0.2em] hover:bg-black/5 dark:hover:bg-white/10 transition-all">
                {t('learnMore')}
              </button>
            </div>
          </div>
        </div>

        {/* Hopeful Color Blobs */}
        <div className="absolute top-[10%] -right-[10%] w-[60%] h-[70%] bg-indigo-500/10 rounded-full blur-[140px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-[10%] left-[5%] w-[40%] h-[50%] bg-savvy-pink/10 rounded-full blur-[140px] -z-10 delay-1000"></div>
        <div className="absolute top-[50%] left-[40%] w-[30%] h-[40%] bg-savvy-amber/10 rounded-full blur-[120px] -z-10"></div>
      </section>

      {/* Trust Grid */}
      <section className="py-52 border-y border-gray-100 dark:border-white/5 relative bg-white/40 dark:bg-white/2 backdrop-blur-3xl">
        <div className="max-w-[1400px] mx-auto px-10">
          <div className="text-center mb-32">
             <h2 className="text-5xl sm:text-7xl font-black tracking-tighter dark:text-white mb-8">{t('whySavvy')}</h2>
             <div className="w-24 h-2.5 bg-gradient-to-r from-savvy-primary to-savvy-pink mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { icon: '🛡️', title: t('trustTitle'), desc: t('trustDesc'), color: 'text-indigo-500' },
              { icon: '🧠', title: t('aiTitle'), desc: t('aiDesc'), color: 'text-savvy-pink' },
              { icon: '🏛️', title: t('exclusiveTitle'), desc: t('exclusiveDesc'), color: 'text-savvy-amber' }
            ].map((f, i) => (
              <div key={i} className="group p-16 bg-white dark:bg-[#0c0c0e] rounded-[4.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:-translate-y-4 transition-all duration-700">
                <div className="text-6xl mb-12 group-hover:scale-110 group-hover:rotate-6 transition-transform">{f.icon}</div>
                <h3 className={`text-3xl font-black mb-8 tracking-tight ${f.color}`}>{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hopeful Vision Section */}
      <section className="py-60 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-10 flex flex-col lg:flex-row items-center gap-32">
          <div className="lg:w-1/2">
             <div className="relative">
               <div className="absolute -inset-10 bg-gradient-to-br from-savvy-pink/20 to-savvy-amber/20 blur-[100px] -z-10"></div>
               <h2 className="text-6xl sm:text-[7rem] font-black tracking-tighter dark:text-white mb-12 leading-[0.85]">Built for the bright future of AAU.</h2>
               <p className="text-2xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-16">
                 Savvy Market isn't just about selling things. It's about creating a safe, trustworthy space for students to help each other thrive. Every trade counts toward a better campus experience.
               </p>
               <button onClick={onGetStarted} className="group flex items-center gap-6 text-savvy-pink font-black text-sm uppercase tracking-[0.4em] transition-all">
                 <span>Explore the market</span>
                 <div className="w-16 h-16 bg-savvy-pink/10 rounded-full flex items-center justify-center group-hover:bg-savvy-pink group-hover:text-white transition-all">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                 </div>
               </button>
             </div>
          </div>
          <div className="lg:w-1/2 grid grid-cols-2 gap-8">
             <div className="p-14 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[5rem] text-center shadow-xl animate-float">
                <span className="text-7xl block mb-4">🌟</span>
                <span className="text-xs font-black uppercase tracking-widest text-savvy-teal">Community First</span>
             </div>
             <div className="p-14 bg-gradient-to-br from-savvy-primary to-savvy-pink rounded-[5rem] text-white text-center shadow-xl mt-20">
                <span className="text-7xl block mb-4">🔐</span>
                <span className="text-xs font-black uppercase tracking-widest">AAU Secure</span>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
