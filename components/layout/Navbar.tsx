
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

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10 px-6 sm:px-10 py-4 sm:py-5 flex items-center justify-between transition-all duration-700 dark:border-white/5">
      <div className="flex items-center gap-6 sm:gap-12">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => onNavigate('landing')}>
          <div className="w-10 h-10 bg-black dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-black font-bold text-xl shadow-xl group-hover:scale-110 transition-all duration-300">
            ሳ
          </div>
          <span className="text-xl font-black tracking-tighter hidden sm:block dark:text-white">{t('appName')}</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => onNavigate(user ? 'home' : 'landing')}
            className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-indigo-500 ${['home', 'landing'].includes(currentPage) ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            {user ? t('feed') : 'Overview'}
          </button>
          
          {user && (
            <>
              <button 
                onClick={() => onNavigate('dashboard')}
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-indigo-500 ${currentPage === 'dashboard' ? 'text-indigo-600' : 'text-gray-400'}`}
              >
                {t('myStore')}
              </button>
              
              <button 
                onClick={() => onNavigate('orders')}
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-indigo-500 ${currentPage === 'orders' ? 'text-indigo-600' : 'text-gray-400'}`}
              >
                {t('myOrders')}
              </button>
              
              <button 
                onClick={() => onNavigate('messages')}
                className={`relative group/btn text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-indigo-500 ${currentPage === 'messages' ? 'text-indigo-600' : 'text-gray-400'}`}
              >
                {t('inbox')}
                <span className="absolute -top-1 -right-3 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme} 
          className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:scale-110 transition-all text-xl"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <button 
          onClick={() => setLang(lang === 'en' ? 'am' : 'en')} 
          className="bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black text-black dark:text-white uppercase tracking-[0.1em] transition-all"
        >
          {lang === 'en' ? 'አማርኛ' : 'English'}
        </button>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="text-right hidden lg:block">
              <p className="text-sm font-bold text-black dark:text-white leading-none mb-1">{user.full_name}</p>
              <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">AAU Student</span>
            </div>
            <button 
              onClick={onLogout} 
              className="w-10 h-10 bg-gray-50 dark:bg-white/5 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onNavigate('login')} 
            className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-xl hover:scale-105 transition-all"
          >
            {t('login')}
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
