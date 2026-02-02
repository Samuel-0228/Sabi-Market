
import React, { useState, useEffect, useCallback } from 'react';
import { authApi } from '../features/auth/auth.api';
import { supabase } from '../services/supabase/client';
import { Listing, UserProfile } from '../types/index';
import { useLanguage } from './LanguageContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Landing from '../pages/Home/Landing';
import Home from '../pages/Home/Home';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import SellerDashboard from '../pages/Dashboard/SellerDashboard';
import CheckoutPage from '../pages/Checkout/CheckoutPage';
import MessagesPage from '../pages/Messages/MessagesPage';
import AddListingModal from '../components/product/AddListingModal';
import ChatBot from '../features/chat/ChatBot';

const App: React.FC = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showAddListing, setShowAddListing] = useState(false);

  const syncUser = useCallback(async () => {
    try {
      const profile = await authApi.syncProfile();
      setUser(profile);
      return profile;
    } catch (e) {
      console.error("Sync user error:", e);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Use getSession for instant local storage check to prevent "forever loading"
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          const u = await syncUser();
          if (u) setCurrentPage('home');
        }
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log(`Auth Event: ${event}`);
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const u = await syncUser();
        if (u) {
          setCurrentPage(prev => (['landing', 'login', 'register'].includes(prev) ? 'home' : prev));
        }
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
    if (!user && ['dashboard', 'messages', 'checkout'].includes(page)) {
      setCurrentPage('login');
    } else {
      setCurrentPage(page);
    }
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#050505]">
        <div className="relative">
          <div className="w-16 h-16 border-[3px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600 text-xs">ሳ</div>
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 animate-pulse">Synchronizing Savvy</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'landing': return <Landing onGetStarted={() => handleNavigate(user ? 'home' : 'login')} />;
      case 'login': return <Login onSwitch={() => setCurrentPage('register')} onSuccess={() => setCurrentPage('home')} />;
      case 'register': return <Register onSwitch={() => setCurrentPage('login')} onSuccess={() => setCurrentPage('home')} />;
      case 'home': return <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={(l) => { setSelectedListing(l); handleNavigate('checkout'); }} onNavigate={handleNavigate} />;
      case 'dashboard': return user ? <SellerDashboard user={user} /> : <Login onSwitch={() => setCurrentPage('register')} onSuccess={() => setCurrentPage('home')} />;
      case 'messages': return user ? <MessagesPage user={user} /> : <Login onSwitch={() => setCurrentPage('register')} onSuccess={() => setCurrentPage('home')} />;
      case 'checkout': return selectedListing ? <CheckoutPage listing={selectedListing} onSuccess={() => setCurrentPage('dashboard')} onCancel={() => setCurrentPage('home')} /> : <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={(l) => { setSelectedListing(l); handleNavigate('checkout'); }} onNavigate={handleNavigate} />;
      default: return <Landing onGetStarted={() => handleNavigate('login')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-600 selection:text-white dark:bg-[#050505] transition-colors duration-500">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} onLogout={() => authApi.logout()} user={user} />
      <main className="flex-1">{renderContent()}</main>
      <Footer onNavigate={handleNavigate} />
      {showAddListing && (
        <AddListingModal onClose={() => setShowAddListing(false)} onSuccess={() => { setShowAddListing(false); syncUser(); setCurrentPage('home'); }} />
      )}
      {user && <ChatBot />}
    </div>
  );
};

export default App;
