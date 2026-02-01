
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
        // Attempt to get the current user profile
        const u = await db.getCurrentUser();
        if (u) {
          setUser(u);
          setCurrentPage('home');
        }
      } catch (err: any) {
        console.error("Critical Auth Initialization Error:", err);
        // We don't block the app, just log the error and let them see the auth screen
        if (err.message?.includes('profiles')) {
          setInitError("Database table 'profiles' is missing. Please run the SQL migration.");
        }
      } finally {
        // Crucial: Always stop loading regardless of error
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        try {
          const u = await db.getCurrentUser();
          setUser(u);
          if (u && currentPage === 'auth') setCurrentPage('home');
        } catch (e) {
          console.error("Auth state change error", e);
        }
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
    try {
      setLoading(true);
      const u = await db.getCurrentUser();
      setUser(u);
      setCurrentPage('home');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
      <div className="h-screen flex flex-col items-center justify-center dark:bg-black bg-white">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <div className="text-center animate-pulse">
           <h2 className="text-xl font-black tracking-tighter dark:text-white">ሳቪ – Savvy Market</h2>
           <p className="text-gray-400 text-xs uppercase tracking-widest mt-2">Loading Secure Environment...</p>
        </div>
        {initError && (
          <div className="mt-10 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl max-w-sm text-center">
            <p className="text-red-500 text-xs font-bold">{initError}</p>
            <button onClick={() => window.location.reload()} className="mt-3 text-[10px] font-black uppercase underline dark:text-white">Retry Connection</button>
          </div>
        )}
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
