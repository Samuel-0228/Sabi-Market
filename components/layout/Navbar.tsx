
import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../app/LanguageContext';
import { useTheme } from '../../app/ThemeContext';
import { useAuthStore } from '../../features/auth/auth.store';
import { supabase } from '../../shared/lib/supabase';

const Navbar: React.FC = () => {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-8 py-8 flex items-center justify-between mix-blend-difference pointer-events-none">
      <div className="pointer-events-auto">
        <Link to="/" className="group flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black font-black text-xl shadow-2xl transition-transform group-hover:rotate-12">
            ሳ
          </div>
          <span className="text-white font-black tracking-[0.3em] uppercase text-[10px] hidden sm:block">
            {t('appName')}
          </span>
        </Link>
      </div>

      <div className="hidden lg:flex pointer-events-auto items-center gap-12 text-white">
        <NavLink to="/marketplace" className={({ isActive }) => `text-[9px] font-black uppercase tracking-[0.4em] transition-all hover:opacity-60 ${isActive ? 'text-savvy-accent' : ''}`}>
          {t('marketplace')}
        </NavLink>
        {user && (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `text-[9px] font-black uppercase tracking-[0.4em] transition-all hover:opacity-60 ${isActive ? 'text-savvy-accent' : ''}`}>
              {t('dashboard')}
            </NavLink>
            <NavLink to="/inbox" className={({ isActive }) => `text-[9px] font-black uppercase tracking-[0.4em] transition-all hover:opacity-60 ${isActive ? 'text-savvy-accent' : ''}`}>
              {t('inbox')}
            </NavLink>
          </>
        )}
      </div>

      <div className="flex pointer-events-auto items-center gap-6 text-white">
        <button onClick={toggleTheme} className="text-[10px] font-black uppercase tracking-widest">{theme === 'light' ? 'NIGHT' : 'DAY'}</button>
        <button onClick={() => setLang(lang === 'en' ? 'am' : 'en')} className="text-[10px] font-black uppercase tracking-widest">{lang === 'en' ? 'አማ' : 'EN'}</button>
        
        {user ? (
          <button onClick={handleLogout} className="bg-white text-black px-6 py-3 rounded-full text-[9px] font-black tracking-widest uppercase hover:invert transition-all">
            EXIT
          </button>
        ) : (
          <Link to="/auth" className="bg-white text-black px-8 py-3 rounded-full text-[9px] font-black tracking-widest uppercase hover:invert transition-all">
            JOIN
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
