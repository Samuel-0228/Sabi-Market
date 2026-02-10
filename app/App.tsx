
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showAddListing, setShowAddListing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const syncUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const profile = await authApi.syncProfile();
      setUser(profile);
      return profile;
    } catch (e) {
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await syncUser();
      if (mounted) {
        setIsInitializing(false);
        const last = localStorage.getItem('savvy_last_page');
        if (last && !['landing', 'auth'].includes(last)) setCurrentPage(last);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        await syncUser();
        setCurrentPage(prev => (['landing', 'auth'].includes(prev) ? 'home' : prev));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentPage('landing');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncUser]);

  const handleNavigate = (page: string) => {
    if (!user && ['home', 'dashboard', 'messages', 'orders'].includes(page)) {
      setCurrentPage('auth');
      return;
    }
    setCurrentPage(page);
    if (user && !['landing', 'auth'].includes(page)) {
      localStorage.setItem('savvy_last_page', page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#050505]">
        <div className="w-16 h-16 border-[3px] border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 animate-pulse">Establishing Connection...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'landing': return <Landing onGetStarted={() => handleNavigate('auth')} />;
      case 'auth': return <Auth onSuccess={() => handleNavigate('home')} />;
      case 'home': return <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={(l) => { setSelectedListing(l); handleNavigate('checkout'); }} onNavigate={handleNavigate} />;
      case 'dashboard': return user ? <SellerDashboard user={user} /> : <Landing onGetStarted={() => handleNavigate('auth')} />;
      case 'messages': return user ? <InboxPage user={user} /> : <Landing onGetStarted={() => handleNavigate('auth')} />;
      case 'orders': return user ? <OrdersPage user={user} /> : <Landing onGetStarted={() => handleNavigate('auth')} />;
      case 'checkout': return (user && selectedListing) ? <Checkout listing={selectedListing} onSuccess={() => handleNavigate('orders')} onCancel={() => handleNavigate('home')} /> : <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={(l) => { setSelectedListing(l); handleNavigate('checkout'); }} onNavigate={handleNavigate} />;
      default: return <Landing onGetStarted={() => handleNavigate('auth')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col dark:bg-[#050505] selection:bg-indigo-600 selection:text-white">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} onLogout={() => authApi.logout()} user={user} />
      <main className="flex-1 overflow-x-hidden">{renderContent()}</main>
      <Footer onNavigate={handleNavigate} />
      {showAddListing && user && (
        <AddListingModal onClose={() => setShowAddListing(false)} onSuccess={() => { setShowAddListing(false); syncUser(); handleNavigate('home'); }} />
      )}
      {user && <ChatBot />}
      <ToastContainer />
    </div>
  );
};

export default App;
