
import React, { useState, useEffect } from 'react';
import { db, supabase } from './services/supabaseService';
import { Listing, UserProfile } from './types';
import { LanguageProvider } from './components/LanguageContext';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Home from './components/Home';
import SellerDashboard from './components/SellerDashboard';
import AddListingModal from './components/AddListingModal';
import ChatBot from './components/ChatBot';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'auth' | 'home' | 'dashboard' | 'admin'>('home');
  const [showAddListing, setShowAddListing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  useEffect(() => {
    // Check initial session
    const initAuth = async () => {
      const u = await db.getCurrentUser();
      setUser(u);
      setLoading(false);
    };

    initAuth();

    // Standard Supabase v2 auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, _session) => {
      const u = await db.getCurrentUser();
      setUser(u);
      if (!u) setCurrentPage('auth');
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
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

  const renderPage = () => {
    if (loading) return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

    if (!user) return <Auth onSuccess={handleAuthSuccess} />;

    switch (currentPage) {
      case 'home':
        return <Home onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} />;
      case 'dashboard':
        return <SellerDashboard />;
      default:
        return <Home onSelectListing={setSelectedListing} onAddListing={() => setShowAddListing(true)} />;
    }
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen pb-20">
        <Navbar 
          onNavigate={(p) => setCurrentPage(p as any)} 
          currentPage={currentPage} 
          onLogout={handleLogout}
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

        <footer className="mt-20 border-t border-gray-100 py-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
             <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-bold">ሳ</div>
             <span className="font-bold text-gray-900">Savvy Market</span>
          </div>
          <p className="text-gray-400 text-xs">© 2025 Addis Ababa University Marketplace.</p>
          <p className="text-indigo-500 font-black text-sm mt-2">Built by Savvy Team</p>
        </footer>

        {user && <ChatBot />}
      </div>
    </LanguageProvider>
  );
};

export default App;
