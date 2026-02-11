
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './services/supabase/client';
import { db } from './services/supabase/db';
import { Listing, UserProfile } from './types';
import { useLanguage } from './app/LanguageContext';

import Navbar from './components/layout/Navbar';
import Auth from './components/Auth';
import Home from './pages/Home/Home';
import Landing from './pages/Home/Landing';
import SellerDashboard from './pages/Dashboard/SellerDashboard';
import AddListingModal from './components/product/AddListingModal';
import ChatBot from './features/chat/ChatBot';
import Checkout from './pages/Checkout/CheckoutPage';
import Footer from './components/layout/Footer';
import InboxPage from './messaging/inbox/InboxPage';
import OrdersPage from './pages/Orders/OrdersPage';
import ToastContainer from './components/ui/ToastContainer';

const App: React.FC = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showAddListing, setShowAddListing] = useState(false);

  const syncUser = useCallback(async () => {
    try {
      const u = await db.getCurrentUser();
      setUser(u);
      return u;
    } catch (e) {
      console.error("Auth sync error:", e);
      return null;
    }
  }, []);

  // Watch user state to force redirection when logged in
  useEffect(() => {
    if (user && (currentPage === 'auth' || currentPage === 'landing')) {
      const lastPage = localStorage.getItem('savvy_last_page');
      setCurrentPage(lastPage && lastPage !== 'landing' ? lastPage : 'home');
    }
  }, [user, currentPage]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          await syncUser();
        }
      } catch (e) {
        console.error("Init failed:", e);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        const u = await syncUser();
        if (u) {
          setCurrentPage(prev => (['landing', 'auth'].includes(prev) ? 'home' : prev));
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
    };
  }, [syncUser]);

  const handleNavigate = (page: string) => {
    if (!user && ['dashboard', 'messages', 'checkout', 'orders', 'home'].includes(page)) {
      setCurrentPage('auth');
    } else {
      setCurrentPage(page);
      if (user && page !== 'landing') localStorage.setItem('savvy_last_page', page);
    }
    window.scrollTo(0, 0);
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#050505]">
        <div className="relative">
          <div className="w-16 h-16 border-[3px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600 text-[10px]">ሳ</div>
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 animate-pulse">ሳቪ – AAU Sync</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'landing': return <Landing onGetStarted={() => handleNavigate('auth')} />;
      case 'auth': return <Auth onSuccess={() => handleNavigate('home')} />;
      case 'home': return <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={(l) => { setSelectedListing(l); handleNavigate('checkout'); }} onNavigate={handleNavigate} />;
      case 'dashboard': return user ? <SellerDashboard user={user} /> : <Auth onSuccess={() => handleNavigate('dashboard')} />;
      case 'orders': return user ? <OrdersPage user={user} /> : <Auth onSuccess={() => handleNavigate('orders')} />;
      case 'messages': return user ? <InboxPage user={user} /> : <Auth onSuccess={() => handleNavigate('messages')} />;
      case 'checkout': return selectedListing ? <Checkout listing={selectedListing} onSuccess={() => handleNavigate('orders')} onCancel={() => handleNavigate('home')} /> : <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={(l) => { setSelectedListing(l); handleNavigate('checkout'); }} onNavigate={handleNavigate} />;
      default: return <Landing onGetStarted={() => handleNavigate('auth')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white dark:bg-[#050505] transition-colors duration-700">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} onLogout={() => supabase.auth.signOut()} user={user} />
      <main className="flex-1">{renderContent()}</main>
      <Footer onNavigate={handleNavigate} />
      {showAddListing && (
        <AddListingModal onClose={() => setShowAddListing(false)} onSuccess={() => { setShowAddListing(false); syncUser(); handleNavigate('home'); }} />
      )}
      {user && <ChatBot />}
      <ToastContainer />
    </div>
  );
};

export default App;
