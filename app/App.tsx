
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useLanguage } from './LanguageContext';
import { supabase } from '../services/supabase/client';
import { authApi } from '../features/auth/auth.api';
import { useAuthStore } from '../store/auth.store';
import { Listing } from '../types';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Landing from '../pages/Home/Landing';
import Home from '../pages/Home/Home';
import Auth from '../components/Auth';
import ChatBot from '../features/chat/ChatBot';
import ToastContainer from '../components/ui/ToastContainer';

// Performance: Lazy load pages
const SellerDashboard = lazy(() => import('../pages/Dashboard/SellerDashboard'));
const InboxPage = lazy(() => import('../messaging/inbox/InboxPage'));
const OrdersPage = lazy(() => import('../pages/Orders/OrdersPage'));
const Checkout = lazy(() => import('../pages/Checkout/CheckoutPage'));
const AddListingModal = lazy(() => import('../components/product/AddListingModal'));

const App: React.FC = () => {
  const { t } = useLanguage();
  const { user, initialized, sync } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showAddListing, setShowAddListing] = useState(false);
  
  // 1. Single source of truth for auth hydration on mount/reload
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      await sync();
      if (mounted) {
        const last = localStorage.getItem('savvy_last_page');
        // Only restore last page if user is logged in
        if (last && !['landing', 'auth'].includes(last)) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) setCurrentPage(last);
        }
      }
    };

    init();

    // 2. Listen for auth changes to sync state globally
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        await sync();
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.getState().setUser(null);
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
    if (!user && ['home', 'dashboard', 'messages', 'orders', 'checkout'].includes(page)) {
      setCurrentPage('auth');
      return;
    }
    setCurrentPage(page);
    if (user && !['landing', 'auth'].includes(page)) {
      localStorage.setItem('savvy_last_page', page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 3. Prevent infinite loading by providing a clear fallback until auth is ready
  if (!initialized) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#050505]">
        <div className="w-16 h-16 border-[3px] border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 animate-pulse">Syncing Campus Data...</p>
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
    <div className="min-h-screen flex flex-col dark:bg-[#050505] selection:bg-indigo-600 selection:text-white transition-colors duration-500">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} onLogout={() => authApi.logout()} user={user} />
      <main className="flex-1 overflow-x-hidden">
        <Suspense fallback={
          <div className="h-[60vh] flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        }>
          {renderContent()}
        </Suspense>
      </main>
      <Footer onNavigate={handleNavigate} />
      {showAddListing && user && (
        <Suspense fallback={null}>
          <AddListingModal onClose={() => setShowAddListing(false)} onSuccess={() => { setShowAddListing(false); sync(); handleNavigate('home'); }} />
        </Suspense>
      )}
      {user && <ChatBot />}
      <ToastContainer />
    </div>
  );
};

export default App;
