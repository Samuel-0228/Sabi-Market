
import React, { useState, useEffect } from 'react';
import { db, supabase } from './services/supabaseService';
import { Listing, UserProfile } from './types';
import { useLanguage } from './components/LanguageContext';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Home from './components/Home';
import SellerDashboard from './components/SellerDashboard';
import AddListingModal from './components/AddListingModal';
import ChatBot from './components/ChatBot';
import Checkout from './components/Checkout';

const App: React.FC = () => {
  // Access the translation function 't' from the LanguageContext
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'auth' | 'home' | 'dashboard' | 'admin' | 'checkout'>('home');
  const [showAddListing, setShowAddListing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const u = await db.getCurrentUser();
      if (u) {
        setUser(u);
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        const u = await db.getCurrentUser();
        setUser(u);
        if (u && currentPage === 'auth') setCurrentPage('home');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentPage('auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthSuccess = async () => {
    const u = await db.getCurrentUser();
    setUser(u);
    setCurrentPage('home');
  };

  const handleLogout = async () => {
    try {
      await db.logout();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setUser(null);
      setCurrentPage('auth');
    }
  };

  const handleInitiateCheckout = (listing: Listing) => {
    setSelectedListing(listing);
    setCurrentPage('checkout');
  };

  const renderPage = () => {
    if (loading) return (
      <div className="h-screen flex items-center justify-center dark:bg-black">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

    if (!user) return <Auth onSuccess={handleAuthSuccess} />;

    switch (currentPage) {
      case 'home':
        return <Home onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={handleInitiateCheckout} />;
      case 'dashboard':
        return <SellerDashboard user={user} />;
      case 'checkout':
        return selectedListing ? (
          <Checkout 
            listing={selectedListing} 
            onSuccess={() => setCurrentPage('dashboard')} 
            onCancel={() => setCurrentPage('home')} 
          />
        ) : <Home onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={handleInitiateCheckout} />;
      default:
        return <Home onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={handleInitiateCheckout} />;
    }
  };

  return (
    <div className="min-h-screen pb-20 transition-colors duration-500">
      <Navbar 
        onNavigate={(p) => setCurrentPage(p as any)} 
        currentPage={currentPage} 
        onLogout={handleLogout}
        user={user}
      />
      
      <main className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {renderPage()}
      </main>

      {showAddListing && (
        <AddListingModal 
          onClose={() => setShowAddListing(false)} 
          onSuccess={() => {
            setShowAddListing(false);
            setCurrentPage('home');
          }} 
        />
      )}

      <footer className="mt-20 border-t border-gray-100 dark:border-white/5 py-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black font-bold">ሳ</div>
            <span className="font-bold text-gray-900 dark:text-white">{t('appName')}</span>
        </div>
        <p className="text-gray-400 text-xs">© 2025 Addis Ababa University Marketplace.</p>
        <p className="text-indigo-500 font-black text-sm mt-2">Built by Savvy Team</p>
      </footer>

      {user && <ChatBot />}
    </div>
  );
};

export default App;
