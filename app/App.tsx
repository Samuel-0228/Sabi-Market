
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase/client';
import { db } from '../services/supabase/db';
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
import OrdersPage from '../pages/Orders/OrdersPage';
import AddListingModal from '../components/product/AddListingModal';
import ChatBot from '../features/chat/ChatBot';

const App: React.FC = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showAddListing, setShowAddListing] = useState(false);

  const syncProfile = useCallback(async () => {
    try {
      const profile = await db.getCurrentUser();
      setUser(profile);
      return profile;
    } catch (e) {
      console.error("Auth sync error:", e);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && mounted) {
        const u = await syncProfile();
        if (u && mounted) {
          setCurrentPage(p => ['landing', 'login', 'register'].includes(p) ? 'home' : p);
        }
      }
      if (mounted) setIsInitializing(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        await syncProfile();
        setCurrentPage(p => ['landing', 'login', 'register'].includes(p) ? 'home' : p);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentPage('landing');
        // Clean up all sockets on logout
        supabase.removeAllChannels();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncProfile]);

  const handleNavigate = (page: string) => {
    // SECURITY GATE: Redirect unauthenticated users
    if (!user && ['dashboard', 'messages', 'checkout', 'home', 'orders'].includes(page)) {
      setCurrentPage('login');
      return;
    }

    // REALTIME HYGIENE: Remove all channels when leaving the messages page
    // This prevents WebSocket saturation which causes the app to hang.
    if (currentPage === 'messages' && page !== 'messages') {
      supabase.removeAllChannels();
    }

    setCurrentPage(page);
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#050505]">
        <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-[10px] font-black uppercase tracking-widest opacity-40 dark:text-white">Connecting to AAU Node...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-600 selection:text-white dark:bg-[#050505] transition-colors duration-500">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} onLogout={() => supabase.auth.signOut()} user={user} />
      <main className="flex-1">
        {currentPage === 'landing' && <Landing onGetStarted={() => handleNavigate(user ? 'home' : 'login')} />}
        {currentPage === 'login' && <Login onSwitch={() => setCurrentPage('register')} onSuccess={() => setCurrentPage('home')} />}
        {currentPage === 'register' && <Register onSwitch={() => setCurrentPage('login')} onSuccess={() => setCurrentPage('home')} />}
        {currentPage === 'home' && <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={(l) => { setSelectedListing(l); handleNavigate('checkout'); }} onNavigate={handleNavigate} />}
        {currentPage === 'dashboard' && user && <SellerDashboard user={user} />}
        {currentPage === 'orders' && user && <OrdersPage user={user} />}
        {currentPage === 'messages' && user && <MessagesPage user={user} />}
        {currentPage === 'checkout' && selectedListing && <CheckoutPage listing={selectedListing} onSuccess={() => handleNavigate('orders')} onCancel={() => handleNavigate('home')} />}
      </main>
      <Footer onNavigate={handleNavigate} />
      {showAddListing && (
        <AddListingModal onClose={() => setShowAddListing(false)} onSuccess={() => { setShowAddListing(false); syncProfile(); handleNavigate('home'); }} />
      )}
      {user && <ChatBot />}
    </div>
  );
};

export default App;
