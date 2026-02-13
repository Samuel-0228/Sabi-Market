
import React, { useEffect, lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../features/auth/auth.store';
import { useUIStore } from '../store/ui.store';
import { supabase } from '../shared/lib/supabase';
import { useLanguage } from './LanguageContext';

// Layout Components
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ToastContainer from '../components/ui/ToastContainer';
import ChatBot from '../features/chat/ChatBot';

// Page Components
import Landing from '../pages/Home/Landing';
import FeedPage from '../core/feed/FeedPage';
import Auth from '../components/Auth';

// Lazy Loaded Pages
const SellerDashboard = lazy(() => import('../pages/Dashboard/SellerDashboard'));
const OrdersPage = lazy(() => import('../pages/Orders/OrdersPage'));
const Checkout = lazy(() => import('../pages/Checkout/CheckoutPage'));
const InboxPage = lazy(() => import('../messaging/inbox/InboxPage'));
const ProductDetailsPage = lazy(() => import('../pages/Product/ProductDetailsPage'));

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized) return null;

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const VerticalMobileNav: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[110] transition-opacity duration-500 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Vertical Bar */}
      <aside 
        className={`fixed left-0 top-0 bottom-0 w-20 bg-white/90 dark:bg-black/90 backdrop-blur-2xl z-[120] border-r border-black/5 dark:border-white/5 flex flex-col items-center py-24 gap-8 transition-transform duration-500 lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <NavLink 
          to="/dashboard" 
          onClick={onClose}
          className={({ isActive }) => `flex flex-col items-center gap-2 group transition-all ${isActive ? 'text-savvy-accent' : 'text-gray-400'}`}
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center group-active:scale-90 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          </div>
          <span className="text-[7px] font-black uppercase tracking-widest">{t('myStore')}</span>
        </NavLink>

        <NavLink 
          to="/orders" 
          onClick={onClose}
          className={({ isActive }) => `flex flex-col items-center gap-2 group transition-all ${isActive ? 'text-savvy-accent' : 'text-gray-400'}`}
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center group-active:scale-90 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
          <span className="text-[7px] font-black uppercase tracking-widest">{t('myOrders')}</span>
        </NavLink>

        <NavLink 
          to="/inbox" 
          onClick={onClose}
          className={({ isActive }) => `flex flex-col items-center gap-2 group transition-all ${isActive ? 'text-savvy-accent' : 'text-gray-400'}`}
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center group-active:scale-90 transition-transform relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 10 01-2-2V6a2 2 10 012-2h14a2 2 10 012 2v8a2 2 10 01-2 2h-5l-5 5v-5z"/></svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-savvy-accent rounded-full border-2 border-white dark:border-black"></span>
          </div>
          <span className="text-[7px] font-black uppercase tracking-widest">{t('inbox')}</span>
        </NavLink>

        <button 
          onClick={onClose}
          className="mt-auto mb-4 w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
        </button>
      </aside>
    </>
  );
};

const AppRoutes: React.FC = () => {
  const { user, initialized, sync, forceInitialize } = useAuthStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    sync();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string) => {
      if (['SIGNED_IN', 'USER_UPDATED', 'TOKEN_REFRESHED'].includes(event)) {
        await sync();
      }
      if (event === 'SIGNED_OUT') {
        useAuthStore.getState().setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [sync]);

  // Seller Notification Listener
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('order-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `seller_id=eq.${user.id}`
      }, (payload: any) => {
        addToast("🔔 New Trade Request received!", "success");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, addToast]);

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
          className="px-8 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-indigo-600 transition-all active:scale-95"
        >
          System Override
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col dark:bg-[#050505] selection:bg-indigo-600 selection:text-white">
      <Navbar />
      
      {/* Mobile Nav Toggle Button */}
      {user && (
        <button 
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className={`fixed left-4 top-24 z-[105] w-10 h-10 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-xl shadow-lg border border-black/5 dark:border-white/5 flex items-center justify-center transition-all lg:hidden ${isMobileNavOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
        >
          <svg className="w-5 h-5 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      )}

      <VerticalMobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

      <main className="flex-1">
        <Suspense fallback={
          <div className="h-[60vh] flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">
            Loading Application Frame...
          </div>
        }>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/marketplace" replace /> : <Landing />} />
            <Route path="/auth" element={<Auth onSuccess={() => {}} />} />
            <Route path="/marketplace" element={<FeedPage />} />
            <Route path="/product/:id" element={<ProductDetailsPage />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <SellerDashboard user={user!} />
              </ProtectedRoute>
            } />
            
            <Route path="/inbox" element={
              <ProtectedRoute>
                <InboxPage user={user!} />
              </ProtectedRoute>
            } />
            
            <Route path="/orders" element={
              <ProtectedRoute>
                <OrdersPage user={user!} />
              </ProtectedRoute>
            } />

            <Route path="/checkout" element={
              <ProtectedRoute>
                <CheckoutWrapper />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer onNavigate={(path) => navigate(path)} />
      {user && <ChatBot />}
      <ToastContainer />
    </div>
  );
};

// Helper component to extract listing from state for Checkout
const CheckoutWrapper: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const listing = location.state?.listing;

  if (!listing) return <Navigate to="/marketplace" replace />;

  return (
    <Checkout 
      listing={listing} 
      onSuccess={() => navigate('/orders')} 
      onCancel={() => navigate(-1)} 
    />
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);

export default App;
