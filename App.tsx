
import React, { useState, useEffect, useCallback } from 'react';
import { db, supabase } from './services/supabaseService';
import { Listing, UserProfile } from './types';
import { useLanguage } from './components/LanguageContext';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Home from './components/Home';
import Landing from './components/Landing';
import SellerDashboard from './components/SellerDashboard';
import AddListingModal from './components/AddListingModal';
import ChatBot from './components/ChatBot';
import Checkout from './components/Checkout';
import Footer from './components/Footer';
import Messages from './components/Messages';

const App: React.FC = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentPage, setCurrentPage] = useState<'landing' | 'auth' | 'home' | 'dashboard' | 'checkout' | 'messages'>('landing');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showAddListing, setShowAddListing] = useState(false);

  const syncUser = useCallback(async () => {
    try {
      const u = await db.getCurrentUser();
      if (u) {
        setUser(u);
        return u;
      }
    } catch (e) {
      console.error("Auth sync error", e);
    }
    return null;
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          const u = await syncUser();
          if (u) setCurrentPage('home');
        }
      } catch (e) {
        console.error("Init failed", e);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const u = await syncUser();
        if (u) setCurrentPage(p => (['landing', 'auth'].includes(p) ? 'home' : p));
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

  const handleNavigate = (page: any) => {
    // Immediate navigation for better perceived performance
    if (!user && ['dashboard', 'messages', 'checkout'].includes(page)) {
      setCurrentPage('auth');
    } else {
      setCurrentPage(page);
    }
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-black transition-colors duration-500">
        <div className="relative">
          <div className="w-16 h-16 border-[3px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600 text-[10px]">ሳ</div>
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 animate-pulse">Savvy Syncing</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'landing': return <Landing onGetStarted={() => handleNavigate(user ? 'home' : 'auth')} />;
      case 'auth': return <Auth onSuccess={() => setCurrentPage('home')} />;
      case 'home': return <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={(l) => { setSelectedListing(l); setCurrentPage('checkout'); }} onNavigate={handleNavigate} />;
      case 'dashboard': return user ? <SellerDashboard user={user} /> : <Auth onSuccess={() => setCurrentPage('home')} />;
      case 'messages': return user ? <Messages user={user} /> : <Auth onSuccess={() => setCurrentPage('home')} />;
      case 'checkout': return selectedListing ? <Checkout listing={selectedListing} onSuccess={() => setCurrentPage('dashboard')} onCancel={() => setCurrentPage('home')} /> : <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={(l) => { setSelectedListing(l); setCurrentPage('checkout'); }} onNavigate={handleNavigate} />;
      default: return <Landing onGetStarted={() => handleNavigate('auth')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white dark:bg-black transition-colors duration-700">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} onLogout={() => db.logout()} user={user} />
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
