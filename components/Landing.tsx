
import React from 'react';
import { useLanguage } from './LanguageContext';

interface LandingProps {
  onGetStarted: () => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
  const { t } = useLanguage();

  const features = [
    {
      title: t('trustTitle'),
      desc: t('trustDesc'),
      icon: '🛡️',
      color: 'bg-indigo-500/10 text-indigo-500',
      borderColor: 'border-indigo-500/20'
    },
    {
      title: t('aiTitle'),
      desc: t('aiDesc'),
      icon: '🧠',
      color: 'bg-pink-500/10 text-pink-500',
      borderColor: 'border-pink-500/20'
    },
    {
      title: t('exclusiveTitle'),
      desc: t('exclusiveDesc'),
      icon: '🏛️',
      color: 'bg-amber-500/10 text-amber-500',
      borderColor: 'border-amber-500/20'
    }
  ];

  return (
    <div className="reveal">
      {/* Hero Section */}
      <section className="relative pt-32 pb-48 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-8 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 bg-white/80 dark:bg-white/5 border border-indigo-500/20 px-5 py-2.5 rounded-full mb-10 shadow-sm backdrop-blur">
               <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping"></span>
               <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">{t('exclusiveMarket')}</span>
            </div>
            <h1 className="text-6xl sm:text-[6.5rem] font-black tracking-tighter leading-[0.85] mb-12">
              <span className="text-black dark:text-white block">Campus Commerce,</span>
              <span className="vibrant-gradient">Reimagined.</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-500 dark:text-gray-400 font-medium mb-16 max-w-2xl leading-relaxed">
              {t('landingSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <button 
                onClick={onGetStarted}
                className="bg-black dark:bg-white text-white dark:text-black px-12 py-7 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-[0_30px_60px_-15px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95 transition-all"
              >
                {t('getStarted')}
              </button>
              <button className="bg-white dark:bg-white/5 text-black dark:text-white border border-gray-100 dark:border-white/10 px-12 py-7 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
                {t('learnMore')}
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Vibrant Blobs */}
        <div className="absolute top-1/2 -right-[10%] -translate-y-1/2 w-[60%] h-[80%] bg-gradient-to-l from-indigo-500/20 via-pink-500/10 to-transparent blur-[120px] rounded-full -z-10 animate-pulse"></div>
        <div className="absolute -bottom-20 left-[10%] w-[40%] h-[40%] bg-amber-500/10 blur-[100px] rounded-full -z-10"></div>
      </section>

      {/* Features Grid */}
      <section className="bg-gray-50/50 dark:bg-white/2 py-40 border-y border-gray-100 dark:border-white/5 relative">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="text-center mb-32">
            <h2 className="text-4xl sm:text-6xl font-black tracking-tighter dark:text-white mb-8">{t('whySavvy')}</h2>
            <div className="w-24 h-2 bg-gradient-to-r from-indigo-500 to-pink-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((f, i) => (
              <div key={i} className={`group p-14 bg-white dark:bg-black/40 rounded-[4rem] border ${f.borderColor} shadow-sm hover:shadow-2xl hover:-translate-y-4 transition-all duration-500`}>
                <div className={`w-20 h-20 ${f.color} rounded-3xl flex items-center justify-center text-4xl mb-12 group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-3xl font-black mb-8 tracking-tight dark:text-white">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Proof Section */}
      <section className="py-48 relative">
        <div className="max-w-[1400px] mx-auto px-8 flex flex-col lg:flex-row items-center gap-32">
          <div className="lg:w-1/2 grid grid-cols-2 gap-8">
             <div className="p-12 bg-indigo-600 rounded-[4rem] text-white flex flex-col justify-center items-center text-center shadow-xl floating">
                <span className="text-7xl font-black mb-4 tracking-tighter">0%</span>
                <span className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Fraud Reports</span>
             </div>
             <div className="p-12 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[4rem] text-black dark:text-white flex flex-col justify-center items-center text-center shadow-xl">
                <span className="text-7xl font-black mb-4 tracking-tighter">24h</span>
                <span className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Fast Escrow</span>
             </div>
             <div className="col-span-2 p-12 bg-gradient-to-r from-pink-500 to-amber-500 rounded-[4rem] text-white text-center shadow-xl">
                <span className="text-6xl font-black mb-4 tracking-tighter">5K+</span>
                <span className="block text-xs font-black uppercase tracking-[0.2em] opacity-80">Expected AAU Early Adopters</span>
             </div>
          </div>
          <div className="lg:w-1/2">
             <h2 className="text-5xl sm:text-7xl font-black tracking-tighter dark:text-white mb-10 leading-[0.9]">Designed for the New Era of Students.</h2>
             <p className="text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-16">
               We believe student life should be about learning, not worrying about where to find a textbook or if you'll get paid for your old laptop. Savvy provides the infrastructure for a trustworthy campus economy.
             </p>
             <button onClick={onGetStarted} className="group flex items-center gap-6 text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-[0.3em] transition-all">
               <span>Join the movement</span>
               <div className="w-12 h-12 bg-indigo-600/10 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
               </div>
             </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
