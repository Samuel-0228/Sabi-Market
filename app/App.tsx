
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
    const init = async () => {
      const u = await syncUser();
      if (u) setCurrentPage('home');
      setIsInitializing(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const u = await syncUser();
        if (u) setCurrentPage(prev => (prev === 'landing' || prev === 'login' || prev === 'register' ? 'home' : prev));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentPage('landing');
      }
    });
    return () => subscription.unsubscribe();
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
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-black">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Launching Savvy</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'landing': return <Landing onGetStarted={() => handleNavigate('login')} />;
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
    <div className="min-h-screen flex flex-col">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} onLogout={() => authApi.logout()} user={user} />
      <main className="flex-1">
        {renderContent()}
      </main>
      <Footer onNavigate={handleNavigate} />
      {showAddListing && (
        <AddListingModal onClose={() => setShowAddListing(false)} onSuccess={() => { setShowAddListing(false); syncUser(); setCurrentPage('home'); }} />
      )}
      {user && <ChatBot />}
    </div>
  );
};

export default App;
