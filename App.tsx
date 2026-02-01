
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

  useEffect(() => {
    const initTimer = setTimeout(() => {
      if (isInitializing) setIsInitializing(false);
    }, 4000);

    const init = async () => {
      try {
        const currentUser = await db.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setCurrentPage('home');
        } else {
          setCurrentPage('landing');
        }
      } catch (e) {
        setCurrentPage('landing');
      } finally {
        setIsInitializing(false);
        clearTimeout(initTimer);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const u = await db.getCurrentUser();
        setUser(u);
        // Direct redirect on successful login if on landing or auth
        setCurrentPage('home');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentPage('landing');
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(initTimer);
    };
  }, []);

  const handleNavigate = useCallback((page: any) => {
    if (!user && (page === 'dashboard' || page === 'checkout' || page === 'messages')) {
      setCurrentPage('auth');
    } else {
      setCurrentPage(page);
    }
  }, [user]);

  const handleBuyNow = (listing: Listing) => {
    if (!user) {
      setCurrentPage('auth');
      return;
    }
    setSelectedListing(listing);
    setCurrentPage('checkout');
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-black">
        <div className="relative mb-8">
          <div className="w-24 h-24 border-2 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-3xl font-black dark:text-white">ሳ</div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 animate-pulse">Launching Savvy...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'landing': return <Landing onGetStarted={() => handleNavigate(user ? 'home' : 'auth')} />;
      case 'auth': return <Auth onSuccess={() => setCurrentPage('home')} />;
      case 'home': return <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={handleBuyNow} onNavigate={handleNavigate} />;
      case 'dashboard': return user ? <SellerDashboard user={user} /> : <Auth onSuccess={() => setCurrentPage('home')} />;
      case 'messages': return user ? <Messages user={user} /> : <Auth onSuccess={() => setCurrentPage('home')} />;
      case 'checkout': return selectedListing ? <Checkout listing={selectedListing} onSuccess={() => setCurrentPage('dashboard')} onCancel={() => setCurrentPage('home')} /> : <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={handleBuyNow} onNavigate={handleNavigate} />;
      default: return <Landing onGetStarted={() => handleNavigate('auth')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-savvy-pink selection:text-white">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} onLogout={() => db.logout()} user={user} />
      <main className="flex-1">
        {renderContent()}
      </main>
      <Footer onNavigate={handleNavigate} />
      {showAddListing && (
        <AddListingModal onClose={() => setShowAddListing(false)} onSuccess={() => { setShowAddListing(false); setCurrentPage('home'); }} />
      )}
      {user && <ChatBot />}
    </div>
  );
};

export default App;
