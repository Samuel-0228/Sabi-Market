
import React from 'react';
import { useLanguage } from '../../app/LanguageContext';

interface LandingProps {
  onGetStarted: () => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
  const { t } = useLanguage();

  return (
    <div className="reveal overflow-hidden">
      <section className="relative pt-32 pb-64 sm:pt-48 sm:pb-80">
        <div className="max-w-[1400px] mx-auto px-10 relative z-10">
          <div className="max-w-5xl">
            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 px-6 py-3 rounded-full mb-12 backdrop-blur-xl">
               <span className="w-2.5 h-2.5 bg-savvy-teal rounded-full animate-ping"></span>
               <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-[0.4em]">{t('exclusiveMarket')}</span>
            </div>
            <h1 className="text-7xl sm:text-[9.5rem] font-black tracking-tighter leading-[0.8] mb-14">
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
            </div>
          </div>
        </div>
      </section>

      <section className="py-52 border-y border-gray-100 dark:border-white/5 bg-white/40 dark:bg-white/2 backdrop-blur-3xl">
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
              <div key={i} className="p-16 bg-white dark:bg-[#0c0c0e] rounded-[4.5rem] border border-gray-100 dark:border-white/5">
                <div className="text-6xl mb-12">{f.icon}</div>
                <h3 className={`text-3xl font-black mb-8 tracking-tight ${f.color}`}>{f.title}</h3>
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
