
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from './LanguageContext';
import { supabase } from '../services/supabase/client';
import { authApi } from '../features/auth/auth.api';
import { Listing, UserProfile } from '../types';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Landing from '../pages/Home/Landing';
import Home from '../pages/Home/Home';
import SellerDashboard from '../pages/Dashboard/SellerDashboard';
import InboxPage from '../messaging/inbox/InboxPage';
import OrdersPage from '../pages/Orders/OrdersPage';
import Checkout from '../pages/Checkout/CheckoutPage';
import Auth from '../components/Auth';
import AddListingModal from '../components/product/AddListingModal';
import ChatBot from '../features/chat/ChatBot';
import ToastContainer from '../components/ui/ToastContainer';

const App: React.FC = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [authStep, setAuthStep] = useState<'login' | 'initial-email'>('login');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showAddListing, setShowAddListing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBypass, setShowBypass] = useState(false);

  const sync = useCallback(async () => {
    try {
      const profile = await authApi.syncProfile();
      setUser(profile);
      return profile;
    } catch (e) {
      console.error("Critical Auth Sync Error:", e);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Timeout to show bypass button if it takes more than 3.5 seconds
    const bypassTimer = setTimeout(() => {
      if (mounted && loading) setShowBypass(true);
    }, 3500);

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const u = await sync();
          if (mounted && u) {
            const last = localStorage.getItem('savvy_last_page');
            const validPages = ['home', 'dashboard', 'messages', 'orders'];
            setCurrentPage(last && validPages.includes(last) ? last : 'home');
          }
        } else {
          if (mounted) setCurrentPage('landing');
        }
      } catch (e) {
        console.error("Init error:", e);
        if (mounted) setCurrentPage('landing');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        const u = await sync();
        if (u && ['landing', 'auth'].includes(currentPage)) {
          setCurrentPage('home');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentPage('landing');
        localStorage.removeItem('savvy_last_page');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(bypassTimer);
    };
  }, [sync, currentPage, loading]);

  const handleNavigate = async (page: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const isAuth = !!session || !!user;

    if (page === 'login' || page === 'register') {
      setAuthStep(page === 'login' ? 'login' : 'initial-email');
      setCurrentPage('auth');
      return;
    }

    if (!isAuth && ['home', 'dashboard', 'messages', 'checkout', 'orders'].includes(page)) {
      setAuthStep('login');
      setCurrentPage('auth');
    } else {
      setCurrentPage(page);
      if (isAuth && !['auth', 'landing'].includes(page)) {
        localStorage.setItem('savvy_last_page', page);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBypass = () => {
    setLoading(false);
    setCurrentPage('home');
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#050505] animate-in fade-in duration-700">
        <div className="relative">
          <div className="w-20 h-20 border-[3px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600 text-sm">ሳ</div>
        </div>
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 animate-pulse">
          ሳቪ – AAU Sync
        </p>
        <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Establishing Campus Node...
        </p>
        
        {showBypass && (
          <button 
            onClick={handleBypass}
            className="mt-12 px-8 py-4 bg-gray-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] dark:text-white rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all animate-in slide-in-from-bottom-4 duration-500"
          >
            Stuck? Enter Marketplace
          </button>
        )}
      </div>
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'landing': return <Landing onGetStarted={() => handleNavigate('register')} />;
      case 'auth': return <Auth initialStep={authStep} onSuccess={() => handleNavigate('home')} />;
      case 'home': return <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={(l) => { setSelectedListing(l); setCurrentPage('checkout'); }} onNavigate={handleNavigate} />;
      case 'dashboard': return user ? <SellerDashboard user={user} /> : <Auth onSuccess={() => handleNavigate('dashboard')} />;
      case 'messages': return user ? <InboxPage user={user} /> : <Auth onSuccess={() => handleNavigate('messages')} />;
      case 'orders': return user ? <OrdersPage user={user} /> : <Auth onSuccess={() => handleNavigate('orders')} />;
      case 'checkout': return selectedListing ? <Checkout listing={selectedListing} onSuccess={() => handleNavigate('orders')} onCancel={() => handleNavigate('home')} /> : <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={(l) => { setSelectedListing(l); setCurrentPage('checkout'); }} onNavigate={handleNavigate} />;
      default: return <Landing onGetStarted={() => handleNavigate('register')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col dark:bg-[#050505] selection:bg-indigo-600 selection:text-white transition-colors duration-500">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} onLogout={() => authApi.logout()} user={user} />
      <main className="flex-1">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {renderContent()}
        </div>
      </main>
      <Footer onNavigate={handleNavigate} />
      {showAddListing && (
        <AddListingModal 
          onClose={() => setShowAddListing(false)} 
          onSuccess={() => { setShowAddListing(false); sync(); handleNavigate('home'); }} 
        />
      )}
      {user && <ChatBot />}
      <ToastContainer />
    </div>
  );
};

export default App;
