
import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { db } from '../services/supabaseService';
import { UserProfile } from '../types';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage, onLogout }) => {
  const { lang, setLang, t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    db.getCurrentUser().then(setUser);
  }, [currentPage]);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white px-10 py-6 flex items-center justify-between transition-all duration-700">
      <div className="flex items-center gap-16">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => onNavigate('home')}>
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl group-hover:scale-110 transition-all duration-500">
            ሳ
          </div>
          <span className="text-2xl font-black tracking-tighter hidden sm:block">Savvy.</span>
        </div>

        {user && (
          <div className="hidden md:flex items-center gap-12">
            <button 
              onClick={() => onNavigate('home')}
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-black ${currentPage === 'home' ? 'text-black' : 'text-gray-400'}`}
            >
              Feed
            </button>
            <button 
              onClick={() => onNavigate('dashboard')}
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-black ${currentPage === 'dashboard' ? 'text-black' : 'text-gray-400'}`}
            >
              My Store
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-10">
        <button 
          onClick={() => setLang(lang === 'en' ? 'am' : 'en')}
          className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-[0.3em] transition-all"
        >
          {lang === 'en' ? 'አማ' : 'EN'}
        </button>

        {user ? (
          <div className="flex items-center gap-10">
            <div className="h-10 w-[1px] bg-gray-100"></div>
            <div className="flex items-center gap-5">
               <div className="text-right hidden sm:block">
                 <p className="text-sm font-bold text-black leading-none mb-1">{user.full_name}</p>
                 <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Store Live</span>
               </div>
               <button 
                 onClick={onLogout}
                 className="bg-gray-50 hover:bg-black hover:text-white text-black w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm active:scale-90"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
               </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => onNavigate('auth')}
            className="bg-black text-white px-10 py-4 rounded-[1.25rem] text-[10px] font-black tracking-widest uppercase shadow-2xl hover:bg-gray-800 transition-all"
          >
            Launch Store
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
