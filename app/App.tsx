
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useLanguage } from './LanguageContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Landing from '../pages/Home/Landing';
import FeedPage from '../core/feed/FeedPage';
import OrdersPage from '../pages/Orders/OrdersPage';
import InboxPage from '../messaging/inbox/InboxPage';
import SellerDashboard from '../pages/Dashboard/SellerDashboard';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import AddListingModal from '../components/product/AddListingModal';
import CheckoutPage from '../pages/Checkout/CheckoutPage';
import ChatBot from '../features/chat/ChatBot';
import ToastContainer from '../components/ui/ToastContainer';
import { coreClient } from '../services/supabase/coreClient';
import { authApi } from '../features/auth/auth.api';
import { Listing } from '../types';

const App: React.FC = () => {
  const { user, loading: authLoading, sync, setUser } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showAddListing, setShowAddListing] = useState(false);

  // 1. Initial Session Sync & Realtime Auth Listener
  useEffect(() => {
    // Initial check on mount
    sync().then(u => {
      if (u) setCurrentPage('home');
    });

    // Listen for auth events (Login/Logout/Token Refresh) to keep store in sync
    const { data: { subscription } } = coreClient.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const u = await sync();
        // If they were on a guest page, move them to home
        if (u && (currentPage === 'login' || currentPage === 'register' || currentPage === 'landing')) {
           setCurrentPage('home');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentPage('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, [sync, setUser]);

  const handleNavigate = (page: string) => {
    // Check authStore directly to ensure we have the most immediate state
    const currentUser = useAuthStore.getState().user;
    
    // Protection guard for private sections
    if (!currentUser && ['dashboard', 'messages', 'checkout', 'orders'].includes(page)) {
      setCurrentPage('login');
      return;
    }
    
    if (page === 'home' && !currentUser) {
      setCurrentPage('landing');
      return;
    }

    setCurrentPage(page);
  };

  const handleLogout = async () => {
    await authApi.logout();
    setUser(null);
    setCurrentPage('landing');
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#050505]">
        <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-[10px] font-black uppercase tracking-widest opacity-40 dark:text-white text-center">
          <span className="block mb-2">ሳ</span>
          AAU Node Sync...
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'landing': return <Landing onGetStarted={() => handleNavigate(user ? 'home' : 'login')} />;
      case 'login': return <Login onSwitch={() => setCurrentPage('register')} onSuccess={() => setCurrentPage('home')} />;
      case 'register': return <Register onSwitch={() => setCurrentPage('login')} onSuccess={() => setCurrentPage('home')} />;
      case 'home': return (
        <FeedPage 
          onSelectListing={setSelectedListing} 
          onBuyListing={(l) => { setSelectedListing(l); handleNavigate('checkout'); }}
          onAddListing={() => setShowAddListing(true)}
        />
      );
      case 'dashboard': return user ? <SellerDashboard user={user} /> : null;
      case 'orders': return user ? <OrdersPage user={user} /> : null;
      case 'messages': return user ? <InboxPage user={user} /> : null;
      case 'checkout': return selectedListing ? (
        <CheckoutPage 
          listing={selectedListing} 
          onSuccess={() => handleNavigate('orders')} 
          onCancel={() => handleNavigate('home')} 
        />
      ) : null;
      default: return <Landing onGetStarted={() => handleNavigate('login')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-600 selection:text-white dark:bg-[#050505] transition-colors duration-500">
      <Navbar 
        onNavigate={handleNavigate} 
        currentPage={currentPage} 
        onLogout={handleLogout} 
        user={user} 
      />
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
