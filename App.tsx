
import React, { useState, useEffect } from 'react';
import { db, supabase } from './services/supabaseService';
import { Listing, UserProfile } from './types';
import { useLanguage } from './components/LanguageContext';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Home from './components/Home';
import Landing from './components/Landing';
import SellerDashboard from './components/SellerDashboard';
import AddListingModal from './components/AddListingModal';
import ChatBot from './components/ChatBot';
import Checkout from './components/Checkout';
import Footer from './components/Footer';

const App: React.FC = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing Savvy...');
  const [showForceLoad, setShowForceLoad] = useState(false);
  const [currentPage, setCurrentPage] = useState<'landing' | 'auth' | 'home' | 'dashboard' | 'admin' | 'checkout'>('landing');
  const [showAddListing, setShowAddListing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const loadingMessages = [
    "Fetching campus treasures...",
    "Assembling your favorites...",
    "Finding things you'll love...",
    "Connecting to the AAU community...",
    "Almost there, stay savvy...",
    "Optimizing your marketplace..."
  ];

  useEffect(() => {
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[msgIndex]);
    }, 2000);

    const forceLoadTimer = setTimeout(() => {
      setShowForceLoad(true);
    }, 8000);

    const initAuth = async () => {
      try {
        const u = await db.getCurrentUser();
        if (u) {
          setUser(u);
          setCurrentPage('home');
        } else {
          setCurrentPage('landing');
        }
      } catch (err: any) {
        console.error("Critical Initialization Error:", err);
      } finally {
        setTimeout(() => {
          setLoading(false);
          clearInterval(msgInterval);
          clearTimeout(forceLoadTimer);
        }, 1500); // Small buffer for smoother transition
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        const u = await db.getCurrentUser();
        setUser(u);
        if (u && (currentPage === 'auth' || currentPage === 'landing')) setCurrentPage('home');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentPage('landing');
      }
    });

    return () => {
      subscription.unsubscribe();
      clearInterval(msgInterval);
      clearTimeout(forceLoadTimer);
    };
  }, []);

  const handleAuthSuccess = async () => {
    setLoading(true);
    setLoadingMessage("Welcome back! Creating your homepage...");
    const u = await db.getCurrentUser();
    setUser(u);
    setCurrentPage('home');
    setTimeout(() => setLoading(false), 1200);
  };

  const handleLogout = async () => {
    await db.logout();
    setUser(null);
    setCurrentPage('landing');
  };

  const handleInitiateCheckout = (listing: Listing) => {
    if (!user) {
      setCurrentPage('auth');
      return;
    }
    setSelectedListing(listing);
    setCurrentPage('checkout');
  };

  const handleAction = (targetPage: any) => {
    if (!user && (targetPage === 'dashboard' || targetPage === 'checkout')) {
      setCurrentPage('auth');
    } else {
      setCurrentPage(targetPage);
    }
  };

  const renderPage = () => {
    if (loading) return (
      <div className="h-screen flex flex-col items-center justify-center dark:bg-black bg-white relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/20 rounded-full blur-[80px] animate-pulse delay-700"></div>

        <div className="relative z-10 text-center">
          <div className="relative mb-12 inline-block">
             <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-black dark:text-white">ሳ</div>
          </div>
          
          <div className="space-y-4">
             <h2 className="text-2xl font-black tracking-tighter dark:text-white">Savvy Market</h2>
             <p className="text-indigo-600 dark:text-indigo-400 text-sm font-bold uppercase tracking-[0.2em] pulse-slow min-h-[1.5rem]">
               {loadingMessage}
             </p>
          </div>
        </div>

        {showForceLoad && (
          <button 
            onClick={() => setLoading(false)}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-indigo-500 underline transition-colors"
          >
            Force App Entry
          </button>
        )}
      </div>
    );

    switch (currentPage) {
      case 'landing':
        return <Landing onGetStarted={() => handleAction(user ? 'home' : 'auth')} />;
      case 'auth':
        return <Auth onSuccess={handleAuthSuccess} />;
      case 'home':
        return <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => handleAction('auth')} onBuyListing={handleInitiateCheckout} />;
      case 'dashboard':
        return user ? <SellerDashboard user={user} /> : <Auth onSuccess={handleAuthSuccess} />;
      case 'checkout':
        return selectedListing ? (
          <Checkout listing={selectedListing} onSuccess={() => setCurrentPage('dashboard')} onCancel={() => setCurrentPage('home')} />
        ) : <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={handleInitiateCheckout} />;
      default:
        return <Landing onGetStarted={() => handleAction(user ? 'home' : 'auth')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500">
      <Navbar onNavigate={handleAction} currentPage={currentPage} onLogout={handleLogout} user={user} />
      
      <main className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {renderPage()}
      </main>

      {showAddListing && (
        <AddListingModal onClose={() => setShowAddListing(false)} onSuccess={() => { setShowAddListing(false); setCurrentPage('home'); }} />
      )}
      
      <Footer onNavigate={handleAction} />

      {user && <ChatBot />}
    </div>
  );
};

export default App;
