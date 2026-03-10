
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Languages, LogOut, User, MessageSquare, ShoppingBag, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../app/LanguageContext';
import { useTheme } from '../../app/ThemeContext';
import { useAuthStore } from '../../features/auth/auth.store';
import { useCartStore } from '../../store/cart.store';
import { supabase } from '../../services/supabase/client';
import { authApi } from '../../features/auth/auth.api';

const Navbar: React.FC = () => {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, setUser } = useAuthStore();
  const { getItemCount } = useCartStore();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const cartCount = getItemCount();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setShowProfileMenu(false);
      await authApi.logout();
      setUser(null);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout locally even if server call fails
      setUser(null);
      localStorage.clear();
      navigate('/', { replace: true });
      window.location.reload();
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-3 md:px-8 py-3 md:py-4 flex items-center justify-between bg-savvy-surface/70 backdrop-blur-xl border-b border-black/5 dark:border-white/5 transition-all duration-300">
      <div className="flex items-center gap-8">
        <Link to="/" className="group flex items-center gap-2 md:gap-4">
          <motion.div 
            whileHover={{ rotate: 12, scale: 1.1 }}
            className="w-8 h-8 md:w-10 md:h-10 bg-savvy-text rounded-lg md:rounded-xl flex items-center justify-center text-savvy-surface font-black text-base md:text-lg shadow-2xl transition-transform"
          >
            ሳ
          </motion.div>
          <span className="text-savvy-text font-black tracking-[0.3em] uppercase text-[7px] md:text-[10px] hidden sm:block">
            {t('appName')}
          </span>
        </Link>
      </div>

      <div className="hidden lg:flex items-center gap-12 text-savvy-text">
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
          </>
        )}
      </div>

      <div className="flex items-center gap-3 md:gap-6 text-savvy-text">
        <button onClick={() => setLang(lang === 'en' ? 'am' : 'en')} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors flex items-center gap-2">
          <Languages className="w-4 h-4" />
          <span className="text-[8px] font-black uppercase tracking-widest">{lang === 'en' ? 'አማ' : 'EN'}</span>
        </button>

        <button 
          onClick={toggleTheme} 
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
        
        {user ? (
          <div className="flex items-center gap-3 relative" ref={menuRef}>
            <Link to="/cart" className="p-2 bg-black/5 dark:bg-white/10 rounded-full relative">
               <ShoppingBag className="w-4 h-4" />
               {cartCount > 0 && (
                 <span className="absolute -top-1 -right-1 bg-savvy-accent text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-black">
                   {cartCount}
                 </span>
               )}
            </Link>
            <Link to="/inbox" className="lg:hidden p-2 bg-black/5 dark:bg-white/10 rounded-full">
               <MessageSquare className="w-4 h-4" />
            </Link>
            
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 pr-3 bg-black/5 dark:hover:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-all border border-black/5 dark:border-white/5"
            >
              <div className="w-8 h-8 rounded-full bg-savvy-accent flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-4 w-64 bg-savvy-surface rounded-3xl shadow-2xl border border-black/5 dark:border-white/5 overflow-hidden z-[110] isolation-auto"
                >
                  <div className="p-6 border-b dark:border-white/5 bg-gray-50/50 dark:bg-black/20">
                    <p className="text-[10px] font-black text-savvy-accent uppercase tracking-widest mb-1">Authenticated</p>
                    <p className="text-sm font-black text-savvy-text truncate">{user.full_name}</p>
                  </div>

                  <div className="p-2">
                    <button 
                      onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-savvy-text">My Account</span>
                    </button>

                    <div className="h-[1px] bg-black/5 dark:bg-white/5 my-2" />

                    <button 
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-left group"
                    >
                      <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-savvy-text group-hover:text-red-500">Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link to="/auth" className="bg-savvy-text text-savvy-surface px-6 md:px-8 py-2 md:py-3 rounded-full text-[8px] md:text-[9px] font-black tracking-widest uppercase hover:opacity-80 transition-all flex items-center gap-2">
            <User className="w-3 h-3" />
            JOIN
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
