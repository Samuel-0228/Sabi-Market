
import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { db } from '../services/supabaseService';
import { UserProfile } from '../types';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage, onLogout }) => {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    db.getCurrentUser().then(setUser);
  }, [currentPage]);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10 px-6 sm:px-10 py-5 sm:py-6 flex items-center justify-between transition-all duration-700 dark:border-white/5">
      <div className="flex items-center gap-6 sm:gap-16">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => onNavigate('home')}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-black font-bold text-xl sm:text-2xl shadow-xl group-hover:scale-110 transition-all duration-500">
            ሳ
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tighter hidden sm:block dark:text-white">Savvy.</span>
        </div>

        {user && (
          <div className="hidden md:flex items-center gap-12">
            <button 
              onClick={() => onNavigate('home')}
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-indigo-500 ${currentPage === 'home' ? 'text-indigo-600' : 'text-gray-400'}`}
            >
              Feed
            </button>
            <button 
              onClick={() => onNavigate('dashboard')}
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-indigo-500 ${currentPage === 'dashboard' ? 'text-indigo-600' : 'text-gray-400'}`}
            >
              My Store
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 sm:gap-8">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:scale-110 transition-all text-xl"
          title="Toggle Theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* Language Toggle */}
        <button 
          onClick={() => setLang(lang === 'en' ? 'am' : 'en')}
          className="text-[10px] font-black text-gray-400 hover:text-indigo-500 dark:hover:text-white uppercase tracking-[0.3em] transition-all"
        >
          {lang === 'en' ? 'አማ' : 'EN'}
        </button>

        {user ? (
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="h-8 w-[1px] bg-gray-200 dark:bg-white/10 hidden sm:block"></div>
            <div className="flex items-center gap-4">
               <div className="text-right hidden lg:block">
                 <p className="text-sm font-bold text-black dark:text-white leading-none mb-1">{user.full_name}</p>
                 <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Live</span>
               </div>
               <button 
                 onClick={onLogout}
                 className="bg-gray-50 dark:bg-white/5 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 text-black dark:text-white w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm active:scale-90"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
               </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => onNavigate('auth')}
            className="bg-black dark:bg-white text-white dark:text-black px-6 sm:px-10 py-3 sm:py-4 rounded-[1.25rem] text-[10px] font-black tracking-widest uppercase shadow-2xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all"
          >
            Launch
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
