
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from './LanguageContext';
import { supabase } from '../services/supabase/client';
import { authApi } from '../features/auth/auth.api';
import { Listing, UserProfile } from '../types';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Landing from '../pages/Home/Landing';
import Home from '../components/Home';
import SellerDashboard from '../pages/Dashboard/SellerDashboard';
import InboxPage from '../messaging/inbox/InboxPage';
import OrdersPage from '../pages/Orders/OrdersPage';
import Checkout from '../components/Checkout';
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
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback(async () => {
    try {
      const profile = await authApi.syncProfile();
      setUser(profile);
      return profile;
    } catch (e) {
      console.error("Sync failed", e);
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const u = await syncUser();
      if (u) setCurrentPage('home');
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        const u = await syncUser();
        if (u) setCurrentPage('home');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentPage('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, [syncUser]);

  const handleNavigate = (page: string) => {
    if (!user && ['dashboard', 'messages', 'checkout', 'orders', 'home'].includes(page)) {
      setCurrentPage('auth');
    } else {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#050505]">
        <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 animate-pulse">ሳቪ – AAU Sync</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'landing': return <Landing onGetStarted={() => handleNavigate(user ? 'home' : 'auth')} />;
      case 'auth': return <Auth onSuccess={() => setCurrentPage('home')} />;
      case 'home': return (
        <Home 
          user={user} 
          onSelectListing={(l) => setSelectedListing(l)} 
          onBuyListing={(l) => { setSelectedListing(l); setCurrentPage('checkout'); }}
          onAddListing={() => setShowAddListing(true)}
          onNavigate={handleNavigate}
        />
      );
      case 'dashboard': return user ? <SellerDashboard user={user} /> : null;
      case 'messages': return user ? <InboxPage user={user} /> : null;
      case 'orders': return user ? <OrdersPage user={user} /> : null;
      case 'checkout': return selectedListing ? (
        <Checkout 
          listing={selectedListing} 
          onSuccess={() => setCurrentPage('orders')} 
          onCancel={() => setCurrentPage('home')} 
        />
      ) : null;
      default: return <Landing onGetStarted={() => handleNavigate('auth')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-600 selection:text-white dark:bg-[#050505] transition-colors duration-500">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} onLogout={() => authApi.logout()} user={user} />
      <main className="flex-1">
        {renderContent()}
      </main>
      <Footer onNavigate={handleNavigate} />
      {showAddListing && (
        <AddListingModal 
          onClose={() => setShowAddListing(false)} 
          onSuccess={() => { setShowAddListing(false); handleNavigate('home'); }} 
        />
      )}
      {user && <ChatBot />}
      <ToastContainer />
    </div>
  );
};

export default App;
