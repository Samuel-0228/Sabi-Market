
import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon, Sun, Languages, LogOut, User, MessageSquare, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../../app/LanguageContext';
import { useTheme } from '../../app/ThemeContext';
import { useAuthStore } from '../../features/auth/auth.store';
import { supabase } from '../../services/supabase/client';

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
    <nav className="fixed top-0 left-0 right-0 z-[100] px-4 md:px-8 py-4 md:py-8 flex items-center justify-between mix-blend-difference pointer-events-none">
      <div className="pointer-events-auto">
        <Link to="/" className="group flex items-center gap-3 md:gap-4">
          <motion.div 
            whileHover={{ rotate: 12, scale: 1.1 }}
            className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-black font-black text-lg md:text-xl shadow-2xl transition-transform"
          >
            ሳ
          </motion.div>
          <span className="text-white font-black tracking-[0.3em] uppercase text-[8px] md:text-[10px] hidden sm:block">
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
            <NavLink to="/cart" className={({ isActive }) => `text-[9px] font-black uppercase tracking-[0.4em] transition-all hover:opacity-60 ${isActive ? 'text-savvy-accent' : ''}`}>
              Cart
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `text-[9px] font-black uppercase tracking-[0.4em] transition-all hover:opacity-60 ${isActive ? 'text-savvy-accent' : ''}`}>
              {t('profile')}
            </NavLink>
          </>
        )}
      </div>

      <div className="flex pointer-events-auto items-center gap-3 md:gap-6 text-white">
        <button onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme" className="p-2 hover:bg-white/10 rounded-full transition-colors">
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
        <button onClick={() => setLang(lang === 'en' ? 'am' : 'en')} className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2">
          <Languages className="w-4 h-4" />
          <span className="text-[8px] font-black uppercase tracking-widest">{lang === 'en' ? 'አማ' : 'EN'}</span>
        </button>
        
        {user ? (
          <div className="flex items-center gap-3">
            <Link to="/cart" aria-label="Open cart" title="Open cart" className="p-2 bg-white/10 rounded-full">
               <ShoppingBag className="w-4 h-4 text-white" />
            </Link>
            <Link to="/inbox" aria-label="Open inbox" title="Open inbox" className="lg:hidden p-2 bg-white/10 rounded-full">
               <MessageSquare className="w-4 h-4 text-white" />
            </Link>
            <button onClick={handleLogout} className="bg-white text-black px-4 md:px-6 py-2 md:py-3 rounded-full text-[8px] md:text-[9px] font-black tracking-widest uppercase hover:invert transition-all flex items-center gap-2">
              <LogOut className="w-3 h-3" />
              <span className="hidden md:inline">EXIT</span>
            </button>
          </div>
        ) : (
          <Link to="/auth" className="bg-white text-black px-6 md:px-8 py-2 md:py-3 rounded-full text-[8px] md:text-[9px] font-black tracking-widest uppercase hover:invert transition-all flex items-center gap-2">
            <User className="w-3 h-3" />
            JOIN
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
