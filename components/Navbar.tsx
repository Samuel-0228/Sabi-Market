
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
    <nav className="sticky top-0 z-50 glass border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
          ሳ
        </div>
        <div className="hidden sm:block">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{t('appName')}</h1>
          <p className="text-[10px] text-indigo-600 font-medium uppercase tracking-wider">{t('slogan')}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setLang(lang === 'en' ? 'am' : 'en')}
          className="px-3 py-1 text-xs font-semibold bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          {lang === 'en' ? 'አማርኛ' : 'English'}
        </button>

        {user && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('dashboard')}
              className={`text-sm font-medium ${currentPage === 'dashboard' ? 'text-indigo-600' : 'text-gray-600'}`}
            >
              {t('dashboard')}
            </button>
            <button 
              onClick={onLogout}
              className="text-sm font-medium text-red-500"
            >
              {t('logout')}
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 relative group">
              <span className="text-xs font-bold text-indigo-700">{user.full_name?.[0]}</span>
              {user.is_verified && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full" title="Verified AAU Student"></span>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
