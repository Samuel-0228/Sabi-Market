
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from './LanguageContext';
import { supabase } from '../services/supabase/client';
import { authApi } from '../features/auth/auth.api';
import { Listing, UserProfile } from '../types';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Landing from '../pages/Home/Landing';
import Home from '../pages/Home/Home';
import SellerDashboard from '../pages/Dashboard/SellerDashboard';
import InboxPage from '../messaging/inbox/InboxPage';
import OrdersPage from '../pages/Orders/OrdersPage';
import Checkout from '../pages/Checkout/CheckoutPage';
import Auth from '../components/Auth';
import AddListingModal from '../components/product/AddListingModal';
import ChatBot from '../features/chat/ChatBot';
import ToastContainer from '../components/ui/ToastContainer';

const App: React.FC = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [authStep, setAuthStep] = useState<'login' | 'initial-email'>('login');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showAddListing, setShowAddListing] = useState(false);
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback(async () => {
    try {
      const profile = await authApi.syncProfile();
      if (profile) {
        setUser(profile);
        return profile;
      }
      setUser(null);
      return null;
    } catch (e) {
      console.error("Auth synchronization failed:", e);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety Timeout: If loading takes too long, force the app to show something
    const safetyTimeout = setTimeout(() => {
      if (loading && mounted) {
        console.warn("Sync timed out, forcing UI unlock.");
        setLoading(false);
      }
    }, 6000);

    const init = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session check error:", sessionError);
          localStorage.clear();
        }

        if (session) {
          const u = await syncUser();
          if (mounted && u) {
            const savedPage = localStorage.getItem('savvy_last_page');
            const target = (savedPage && ['home', 'dashboard', 'messages', 'orders'].includes(savedPage)) ? savedPage : 'home';
            setCurrentPage(target);
          }
        } else {
          if (mounted) setCurrentPage('landing');
        }
      } catch (err) {
        console.error("App init error:", err);
      } finally {
        if (mounted) setLoading(false);
        clearTimeout(safetyTimeout);
      }
    };
    
    init();

    // Listen for Auth Events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log("Auth Event:", event);

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        const u = await syncUser();
        if (u && mounted) {
           // Redirect from Auth/Landing to Home on successful login/register
           setCurrentPage(prev => (['landing', 'auth'].includes(prev) ? 'home' : prev));
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentPage('landing');
        localStorage.removeItem('savvy_last_page');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [syncUser]);

  const handleNavigate = async (page: string) => {
    if (page === 'login') {
      setAuthStep('login');
      setCurrentPage('auth');
      return;
    }
    if (page === 'register') {
      setAuthStep('initial-email');
      setCurrentPage('auth');
      return;
    }

    // Verify auth status before allowing access to internal pages
    const { data: { session } } = await supabase.auth.getSession();
    const isAuthed = !!session;

    if (!isAuthed && ['dashboard', 'messages', 'checkout', 'orders', 'home'].includes(page)) {
      setAuthStep('login');
      setCurrentPage('auth');
    } else {
      setCurrentPage(page);
      if (isAuthed) {
        try {
          localStorage.setItem('savvy_last_page', page);
        } catch (e) {}
      }
    }
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#050505]">
        <div className="relative">
          <div className="w-16 h-16 border-[3px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600 text-[10px]">ሳ</div>
        </div>
        <div className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 animate-pulse">ሳቪ – AAU Sync</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'landing': return <Landing onGetStarted={() => handleNavigate('register')} />;
      case 'auth': return <Auth initialStep={authStep} onSuccess={() => handleNavigate('home')} />;
      case 'home': return (
        <Home 
          user={user} 
          onSelectListing={(l) => setSelectedListing(l)} 
          onBuyListing={(l) => { setSelectedListing(l); setCurrentPage('checkout'); }}
          onAddListing={() => setShowAddListing(true)}
          onNavigate={handleNavigate}
        />
      );
      case 'dashboard': return user ? <SellerDashboard user={user} /> : <Auth initialStep="login" onSuccess={() => handleNavigate('dashboard')} />;
      case 'messages': return user ? <InboxPage user={user} /> : <Auth initialStep="login" onSuccess={() => handleNavigate('messages')} />;
      case 'orders': return user ? <OrdersPage user={user} /> : <Auth initialStep="login" onSuccess={() => handleNavigate('orders')} />;
      case 'checkout': return selectedListing ? (
        <Checkout 
          listing={selectedListing} 
          onSuccess={() => handleNavigate('orders')} 
          onCancel={() => handleNavigate('home')} 
        />
      ) : <Home user={user} onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} onBuyListing={(l) => { setSelectedListing(l); setCurrentPage('checkout'); }} onNavigate={handleNavigate} />;
      default: return <Landing onGetStarted={() => handleNavigate('register')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-600 selection:text-white dark:bg-[#050505] transition-colors duration-500">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} onLogout={() => authApi.logout()} user={user} />
      <main className="flex-1">{renderContent()}</main>
      <Footer onNavigate={handleNavigate} />
      {showAddListing && (
        <AddListingModal 
          onClose={() => setShowAddListing(false)} 
          onSuccess={() => { setShowAddListing(false); syncUser(); handleNavigate('home'); }} 
        />
      )}
      {user && <ChatBot />}
      <ToastContainer />
    </div>
  );
};

export default App;
