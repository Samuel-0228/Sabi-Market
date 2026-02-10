
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

  const sync = useCallback(async () => {
    try {
      const profile = await authApi.syncProfile();
      setUser(profile);
      return profile;
    } catch (e) {
      console.error("Sync error", e);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const u = await sync();
        if (mounted && u) {
          const last = localStorage.getItem('savvy_last_page');
          setCurrentPage(last && ['home', 'dashboard', 'messages', 'orders'].includes(last) ? last : 'home');
        }
      } else {
        if (mounted) setCurrentPage('landing');
      }
      if (mounted) setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const u = await sync();
        if (u) setCurrentPage(prev => (['landing', 'auth'].includes(prev) ? 'home' : prev));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentPage('landing');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [sync]);

  const handleNavigate = async (page: string) => {
    const isAuth = !!(await supabase.auth.getSession()).data.session;

    if (['login', 'register'].includes(page)) {
      setAuthStep(page === 'login' ? 'login' : 'initial-email');
      setCurrentPage('auth');
      return;
    }

    if (!isAuth && ['dashboard', 'messages', 'checkout', 'orders', 'home'].includes(page)) {
      setCurrentPage('auth');
    } else {
      setCurrentPage(page);
      if (isAuth && !['auth', 'landing'].includes(page)) localStorage.setItem('savvy_last_page', page);
    }
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#050505]">
        <div className="w-16 h-16 border-[3px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin" />
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 animate-pulse">ሳቪ – AAU Sync</p>
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
      case 'checkout': return selectedListing ? <Checkout listing={selectedListing} onSuccess={() => handleNavigate('orders')} onCancel={() => handleNavigate('home')} /> : null;
      default: return <Landing onGetStarted={() => handleNavigate('register')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col dark:bg-[#050505] selection:bg-indigo-600 selection:text-white transition-colors duration-500">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} onLogout={() => authApi.logout()} user={user} />
      <main className="flex-1">{renderContent()}</main>
      <Footer onNavigate={handleNavigate} />
      {showAddListing && (
        <AddListingModal onClose={() => setShowAddListing(false)} onSuccess={() => { setShowAddListing(false); sync(); handleNavigate('home'); }} />
      )}
      {user && <ChatBot />}
      <ToastContainer />
    </div>
  );
};

export default App;
