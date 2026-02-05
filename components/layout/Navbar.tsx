
import React from 'react';
import { useLanguage } from '../../app/LanguageContext';
import { useTheme } from '../../app/ThemeContext';
import { UserProfile } from '../../types/index';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onLogout: () => void;
  user: UserProfile | null;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage, onLogout, user }) => {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // "Perfect Parts" - High-fidelity navigation configuration
  const navItems = [
    { 
      id: 'home', 
      label: user ? t('feed') : 'Marketplace', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      id: 'dashboard', 
      label: t('myStore'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ) 
    },
    { 
      id: 'orders', 
      label: t('myOrders'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ) 
    },
    { 
      id: 'messages', 
      label: t('inbox'), 
      badge: user !== null, // Show active indicator if user is logged in
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ) 
    }
  ];

  return (
    <nav className="sticky top-0 z-[100] glass border-b border-white/10 px-6 lg:px-12 py-4 flex items-center justify-between transition-all duration-700 dark:border-white/5">
      {/* Brand & Logo */}
      <div className="flex items-center gap-12">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => onNavigate('landing')}>
          <div className="w-10 h-10 bg-black dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-black font-black text-xl shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
            ሳ
          </div>
          <span className="text-xl font-black tracking-tighter hidden lg:block dark:text-white group-hover:tracking-normal transition-all">{t('appName')}</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                relative px-5 py-2.5 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all group/btn
                ${currentPage === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}
              `}
            >
              <span className={`transition-transform duration-300 ${currentPage === item.id ? 'scale-110' : 'group-hover/btn:scale-110'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              
              {item.badge && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500 border-2 border-white dark:border-[#0c0c0e]"></span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Utilities & Profile */}
      <div className="flex items-center gap-4">
        {/* Theme & Language Toggles */}
        <div className="hidden sm:flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-1 rounded-2xl border border-gray-100 dark:border-white/5">
          <button 
            onClick={toggleTheme} 
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-white/10 hover:shadow-sm transition-all"
            title="Switch Theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-1"></div>
          <button 
            onClick={() => setLang(lang === 'en' ? 'am' : 'en')} 
            className="px-3 py-1.5 rounded-xl text-[9px] font-black text-black dark:text-white uppercase tracking-widest hover:bg-white dark:hover:bg-white/10 hover:shadow-sm transition-all"
          >
            {lang === 'en' ? 'አማ' : 'EN'}
          </button>
        </div>

        {/* Profile Section */}
        {user ? (
          <div className="flex items-center gap-4 pl-4 border-l dark:border-white/5 ml-2">
            <div className="text-right hidden xl:block">
              <p className="text-sm font-black text-black dark:text-white leading-none mb-1">{user.full_name}</p>
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-[8px] font-black text-green-500 uppercase tracking-[0.2em]">Verified Student</span>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              </div>
            </div>
            
            <button 
              onClick={onLogout} 
              className="w-10 h-10 bg-gray-50 dark:bg-white/5 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 rounded-xl flex items-center justify-center transition-all shadow-sm group/logout"
              title={t('logout')}
            >
              <svg className="w-5 h-5 group-hover/logout:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
             <button 
              onClick={() => onNavigate('login')} 
              className="bg-gray-100 dark:bg-white/5 px-6 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all hover:bg-gray-200 dark:hover:bg-white/10 dark:text-white"
            >
              {t('login')}
            </button>
            <button 
              onClick={() => onNavigate('register')} 
              className="btn-hope px-8 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase shadow-xl hover:scale-105 transition-all"
            >
              {t('register')}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
