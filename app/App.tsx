import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuthStore } from '../features/auth/auth.store';
import { useLanguage } from './LanguageContext';
import { supabase } from '../shared/lib/supabase';
import { Listing } from '../types';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Landing from '../pages/Home/Landing';
import FeedPage from '../core/feed/FeedPage';
import Auth from '../components/Auth';
import ChatRoom from '../messaging/inbox/InboxPage'; 
import ToastContainer from '../components/ui/ToastContainer';

const SellerDashboard = lazy(() => import('../pages/Dashboard/SellerDashboard'));
const OrdersPage = lazy(() => import('../pages/Orders/OrdersPage'));
const Checkout = lazy(() => import('../pages/Checkout/CheckoutPage'));
const AddListingModal = lazy(() => import('../components/product/AddListingModal'));

const App: React.FC = () => {
  const { t } = useLanguage();
  const { user, initialized, sync, forceInitialize } = useAuthStore();
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    sync().then((u) => {
      if (u) setCurrentPage('home');
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        const u = await sync();
        if (u && (currentPage === 'auth' || currentPage === 'landing')) {
          setCurrentPage('home');
        }
      }
      if (event === 'SIGNED_OUT') {
        setCurrentPage('landing');
        useAuthStore.getState().setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [sync]);

  const navigate = (page: string) => {
    if (!user && !['landing', 'auth'].includes(page)) {
      setCurrentPage('auth');
    } else {
      setCurrentPage(page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!initialized) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#050505] p-10 text-center">
        <div className="relative mb-12">
          <div className="w-20 h-20 border-[3.5px] border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600 text-lg">ሳ</div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 animate-pulse mb-10">Synchronizing Campus Node...</p>
        
        <button 
          onClick={forceInitialize}
          className="px-8 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-indigo-600 hover:border-indigo-600/30 transition-all active:scale-95"
        >
          System Override
        </button>
      </div>
    );
  }

  const render = () => {
    // If authenticated, default to home if trying to access landing/auth directly
    const effectivePage = (user && (currentPage === 'landing' || currentPage === 'auth')) ? 'home' : currentPage;

    switch (effectivePage) {
      case 'landing': return <Landing onGetStarted={() => navigate('auth')} />;
      case 'auth': return <Auth onSuccess={() => navigate('home')} />;
      case 'home': return <FeedPage onSelectListing={(l: Listing) => { setSelectedListing(l); }} onAddListing={() => setShowAdd(true)} onBuyListing={(l: Listing) => { setSelectedListing(l); navigate('checkout'); }} />;
      case 'dashboard': return <SellerDashboard user={user!} />;
      case 'messages': return <ChatRoom user={user!} />;
      case 'orders': return <OrdersPage user={user!} />;
      case 'checkout': return selectedListing ? <Checkout listing={selectedListing} onSuccess={() => navigate('orders')} onCancel={() => navigate('home')} /> : null;
      default: return <Landing onGetStarted={() => navigate('auth')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col dark:bg-[#050505] selection:bg-indigo-600 selection:text-white">
      <Navbar onNavigate={navigate} currentPage={currentPage} onLogout={() => supabase.auth.signOut()} user={user} />
      <main className="flex-1">
        <Suspense fallback={<div className="h-screen flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">Loading Application Frame...</div>}>
          {render()}
        </Suspense>
      </main>
      <Footer onNavigate={navigate} />
      {showAdd && <AddListingModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); navigate('home'); }} />}
      <ToastContainer />
    </div>
  );
};

export default App;