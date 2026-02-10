
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
  const [syncStalled, setSyncStalled] = useState(false);
  
  const syncInProgress = useRef(false);

  const sync = useCallback(async () => {
    if (syncInProgress.current) return;
    syncInProgress.current = true;
    
    // Show bypass button if sync takes more than 3 seconds
    const stallTimer = setTimeout(() => setSyncStalled(true), 3000);

    try {
      const profile = await authApi.syncProfile();
      setUser(profile);
      clearTimeout(stallTimer);
      setSyncStalled(false);
      return profile;
    } catch (e) {
      console.error("Critical Auth Sync Error:", e);
      return null;
    } finally {
      syncInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 1. FAST PATH: Check for session immediately
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (mounted) {
          setCurrentPage('landing');
          setIsInitializing(false);
        }
        return;
      }

      // 2. SLOW PATH: Session exists, sync profile data
      const u = await sync();
      if (mounted) {
        if (u) {
          const last = localStorage.getItem('savvy_last_page');
          const protectedPages = ['home', 'dashboard', 'messages', 'orders'];
          setCurrentPage(last && protectedPages.includes(last) ? last : 'home');
        } else {
          // If profile sync fails completely after retries, reset
          await supabase.auth.signOut();
          setCurrentPage('landing');
        }
        setIsInitializing(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const u = await sync();
        if (u && (currentPage === 'landing' || currentPage === 'auth')) {
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
    };
  }, [sync]);

  const handleNavigate = (page: string) => {
    const isAuth = !!user;

    // Strict Access Control
    if (!isAuth && ['home', 'dashboard', 'messages', 'checkout', 'orders'].includes(page)) {
      setCurrentPage('auth');
      return;
    }

    setCurrentPage(page);
    if (isAuth && !['auth', 'landing'].includes(page)) {
      localStorage.setItem('savvy_last_page', page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const forceBypass = () => {
    setIsInitializing(false);
    if (!user) setCurrentPage('landing');
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#050505] animate-in fade-in duration-500">
        <div className="relative mb-8">
          <div className="w-20 h-20 border-[3px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600 text-lg">ሳ</div>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 animate-pulse">ሳቪ – AAU Node Sync</p>
          <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Synchronizing Campus Identity...</p>
        </div>
        
        {syncStalled && (
          <button 
            onClick={forceBypass}
            className="mt-12 px-8 py-4 bg-gray-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] dark:text-white rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-gray-100 dark:border-white/5 animate-in slide-in-from-bottom-4"
          >
            Network Slow? Enter Market
          </button>
        )}
      </div>
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'landing': return <Landing onGetStarted={() => handleNavigate('auth')} />;
      case 'auth': return <Auth onSuccess={() => handleNavigate('home')} />;
      case 'home': return <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={(l) => { setSelectedListing(l); setCurrentPage('checkout'); }} onNavigate={handleNavigate} />;
      case 'dashboard': return user ? <SellerDashboard user={user} /> : <Auth onSuccess={() => handleNavigate('dashboard')} />;
      case 'messages': return user ? <InboxPage user={user} /> : <Auth onSuccess={() => handleNavigate('messages')} />;
      case 'orders': return user ? <OrdersPage user={user} /> : <Auth onSuccess={() => handleNavigate('orders')} />;
      case 'checkout': return (user && selectedListing) ? <Checkout listing={selectedListing} onSuccess={() => handleNavigate('orders')} onCancel={() => handleNavigate('home')} /> : <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={(l) => { setSelectedListing(l); setCurrentPage('checkout'); }} onNavigate={handleNavigate} />;
      default: return <Landing onGetStarted={() => handleNavigate('auth')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col dark:bg-[#050505] selection:bg-indigo-600 selection:text-white transition-colors duration-500">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} onLogout={() => authApi.logout()} user={user} />
      <main className="flex-1 overflow-x-hidden">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 fill-mode-both">
          {renderContent()}
        </div>
      </main>
      <Footer onNavigate={handleNavigate} />
      {showAddListing && user && (
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
