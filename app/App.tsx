
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/supabase/db';
import { supabase } from '../services/supabase/client';
import { Listing, UserProfile } from '../types/index.d';
import { useLanguage } from './LanguageContext';
import Navbar from '../components/layout/Navbar';
import Auth from '../pages/Auth/Login';
import Home from '../pages/Home/Home';
import Landing from '../pages/Home/Landing';
import SellerDashboard from '../pages/Dashboard/SellerDashboard';
import AddListingModal from '../components/product/AddListingModal';
import ChatBot from '../features/chat/ChatBot';
import Checkout from '../pages/Checkout/CheckoutPage';
import Footer from '../components/layout/Footer';
import Messages from '../pages/Messages/MessagesPage';

const App: React.FC = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentPage, setCurrentPage] = useState<'landing' | 'auth' | 'home' | 'dashboard' | 'checkout' | 'messages'>('landing');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showAddListing, setShowAddListing] = useState(false);

  useEffect(() => {
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
        console.error("Init error", e);
        setCurrentPage('landing');
      } finally {
        setIsInitializing(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const u = await db.getCurrentUser();
        setUser(u);
        setCurrentPage(prev => (prev === 'landing' || prev === 'auth' ? 'home' : prev));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentPage('landing');
      }
    });

    return () => subscription.unsubscribe();
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
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Initializing Savvy...</p>
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
    <div className="min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">
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
