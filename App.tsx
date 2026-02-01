
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
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'auth' | 'home' | 'dashboard' | 'admin' | 'checkout'>('home');
  const [showAddListing, setShowAddListing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const u = await db.getCurrentUser();
        if (u) {
          setUser(u);
          setCurrentPage('home');
        }
      } catch (err: any) {
        console.error("Auth Init Error:", err);
      } finally {
        setLoading(false);
      }
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
    await db.logout();
    setUser(null);
    setCurrentPage('auth');
  };

  const handleInitiateCheckout = (listing: Listing) => {
    setSelectedListing(listing);
    setCurrentPage('checkout');
  };

  const renderPage = () => {
    if (loading) return (
      <div className="h-screen flex flex-col items-center justify-center dark:bg-black bg-white">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <div className="text-center animate-pulse">
           <h2 className="text-xl font-black tracking-tighter dark:text-white">ሳቪ – Savvy Market</h2>
           <p className="text-gray-400 text-xs uppercase tracking-widest mt-2">Connecting Campus...</p>
        </div>
      </div>
    );

    if (!user) return <Auth onSuccess={handleAuthSuccess} />;

    switch (currentPage) {
      case 'home':
        return <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={handleInitiateCheckout} />;
      case 'dashboard':
        return <SellerDashboard user={user} />;
      case 'checkout':
        return selectedListing ? (
          <Checkout listing={selectedListing} onSuccess={() => setCurrentPage('dashboard')} onCancel={() => setCurrentPage('home')} />
        ) : <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={handleInitiateCheckout} />;
      default:
        return <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={handleInitiateCheckout} />;
    }
  };

  return (
    <div className="min-h-screen pb-20 transition-colors duration-500">
      <Navbar onNavigate={(p) => setCurrentPage(p as any)} currentPage={currentPage} onLogout={handleLogout} user={user} />
      <main className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {renderPage()}
      </main>
      {showAddListing && (
        <AddListingModal onClose={() => setShowAddListing(false)} onSuccess={() => { setShowAddListing(false); setCurrentPage('home'); }} />
      )}
      {user && <ChatBot />}
    </div>
  );
};

export default App;
