
import React from 'react';
import { useLanguage } from '../../app/LanguageContext';

interface FooterProps {
  onNavigate: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  const sections = [
    {
      title: t('platform'),
      links: [
        { name: t('marketplace'), target: 'home' },
        { name: t('dashboard'), target: 'dashboard' },
        { name: 'Pricing', target: 'landing' }
      ]
    },
    {
      title: t('community'),
      links: [
        { name: 'About Savvy', target: 'landing' },
        { name: 'Help Center', target: 'landing' },
        { name: 'Campus Safety', target: 'landing' }
      ]
    },
    {
      title: t('legal'),
      links: [
        { name: 'Privacy Policy', target: 'landing' },
        { name: 'Terms of Service', target: 'landing' },
        { name: 'Escrow Terms', target: 'landing' }
      ]
    }
  ];

  return (
    <footer className="mt-auto bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-white/5 pt-32 pb-16">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-20 mb-32">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-black dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-black font-black text-2xl">ሳ</div>
              <span className="text-2xl font-black tracking-tighter dark:text-white">{t('appName')}</span>
            </div>
            <p className="text-gray-400 font-medium leading-relaxed max-w-sm mb-10">
              {t('exclusiveMarket')} {t('slogan')}
            </p>
          </div>
          {sections.map((sec, i) => (
            <div key={i} className="lg:col-span-1">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 dark:text-gray-600 mb-8">
                {sec.title}
              </h4>
              <ul className="space-y-4">
                {sec.links.map((link, j) => (
                  <li key={j}>
                    <button 
                      onClick={() => onNavigate(link.target)}
                      className="text-gray-500 dark:text-gray-400 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="lg:col-span-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 dark:text-gray-600 mb-8">
              Location
            </h4>
            <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
               <p className="text-xs font-black text-black dark:text-white uppercase tracking-widest mb-1">Main Campus</p>
               <p className="text-[10px] text-gray-400 font-medium">6 Kilo, Addis Ababa</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-gray-50 dark:border-white/5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            © 2025 Savvy Tech. {t('builtForAAU')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
