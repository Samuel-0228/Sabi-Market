
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useLanguage } from './LanguageContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Landing from '../pages/Home/Landing';
import FeedPage from '../core/feed/FeedPage';
import OrdersPage from '../pages/Orders/OrdersPage'; // Kept existing but logic refactored
import InboxPage from '../messaging/inbox/InboxPage';
import SellerDashboard from '../pages/Dashboard/SellerDashboard';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import AddListingModal from '../components/product/AddListingModal';
import CheckoutPage from '../pages/Checkout/CheckoutPage';
import ChatBot from '../features/chat/ChatBot';
import { Listing } from '../types';

const App: React.FC = () => {
  const { user, loading: authLoading, sync } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showAddListing, setShowAddListing] = useState(false);

  useEffect(() => {
    sync().then(u => {
      if (u) setCurrentPage('home');
    });
  }, [sync]);

  const handleNavigate = (page: string) => {
    // SECURITY GATE: Redirect unauthenticated
    if (!user && ['dashboard', 'messages', 'checkout', 'home', 'orders'].includes(page)) {
      setCurrentPage('login');
      return;
    }
    setCurrentPage(page);
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#050505]">
        <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-[10px] font-black uppercase tracking-widest opacity-40 dark:text-white">AAU Secure Node Sync...</div>
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
        onLogout={() => { useAuthStore.getState().setUser(null); setCurrentPage('landing'); }} 
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
    </div>
  );
};

export default App;
