import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, MessageSquare, User, LayoutGrid } from 'lucide-react';
import { useLanguage } from '../../app/LanguageContext';
import { useAuthStore } from '../../features/auth/auth.store';
import { useCartStore } from '../../store/cart.store';

const BottomNav: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const { getItemCount } = useCartStore();
  const cartCount = getItemCount();

  const location = useLocation();
  const isProductPage = location.pathname.startsWith('/product/');

  if (!user) return null;

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-black/5 dark:border-white/5 px-2 pb-safe lg:hidden transition-transform duration-300 ${isProductPage ? 'translate-y-full' : 'translate-y-0'}`}>
      <div className="flex items-center justify-around h-16">
        <NavLink 
          to="/marketplace" 
          className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-savvy-indigo' : 'text-gray-400'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-tighter">Home</span>
        </NavLink>

        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-savvy-indigo' : 'text-gray-400'}`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-tighter">Store</span>
        </NavLink>

        <NavLink 
          to="/inbox" 
          className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-savvy-indigo' : 'text-gray-400'}`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-savvy-accent rounded-full border border-white dark:border-black"></span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-tighter">Inbox</span>
        </NavLink>

        <NavLink 
          to="/cart" 
          className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-savvy-indigo' : 'text-gray-400'}`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-savvy-accent text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-black">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-tighter">Cart</span>
        </NavLink>

        <NavLink 
          to="/profile" 
          className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-savvy-indigo' : 'text-gray-400'}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-tighter">Me</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
