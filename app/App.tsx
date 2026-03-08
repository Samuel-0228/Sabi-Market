
import React, { useEffect, lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/auth.store';
import { useUIStore } from '../store/ui.store';
import { useCartStore } from '../store/cart.store';
import { supabase } from '../services/supabase/client';
import { useLanguage } from './LanguageContext';

// Layout Components
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BottomNav from '../components/layout/BottomNav';
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
const ProfilePage = lazy(() => import('../pages/Profile/ProfilePage'));
const CartPage = lazy(() => import('../pages/Cart/CartPage'));

// Info Pages
const AboutPage = lazy(() => import('../pages/Info/AboutPage'));
const HelpCenterPage = lazy(() => import('../pages/Info/HelpCenterPage'));
const CampusSafetyPage = lazy(() => import('../pages/Info/CampusSafetyPage'));
const PrivacyPolicyPage = lazy(() => import('../pages/Info/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('../pages/Info/TermsOfServicePage'));
const EscrowTermsPage = lazy(() => import('../pages/Info/EscrowTermsPage'));

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

const AppRoutes: React.FC = () => {
  const { user, initialized, loading, sync, forceInitialize } = useAuthStore();
  const { fetchCart } = useCartStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchCart(user.id);
    }
  }, [user, fetchCart]);

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
      }, () => {
        addToast("🔔 New Trade Request received!", "success");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, addToast]);

  if (!initialized || (loading && !user)) {
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
          stuck? click here to get access fast
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col dark:bg-[#050505] selection:bg-indigo-600 selection:text-white pb-20 lg:pb-0">
      <Navbar />
      
      <BottomNav />

      <main className="flex-1">
        <Suspense fallback={
          <div className="h-[60vh] flex items-center justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">
            Loading Application Frame...
          </div>
        }>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/marketplace" replace /> : <Landing />} />
            <Route path="/auth" element={user ? <Navigate to="/marketplace" replace /> : <Auth onSuccess={() => {}} />} />
            <Route path="/marketplace" element={<FeedPage />} />
            <Route path="/product/:id" element={<ProductDetailsPage />} />
            <Route path="/cart" element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            } />
            
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

            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            <Route path="/checkout" element={
              <ProtectedRoute>
                <CheckoutWrapper />
              </ProtectedRoute>
            } />

            {/* Info Routes */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpCenterPage />} />
            <Route path="/safety" element={<CampusSafetyPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/escrow" element={<EscrowTermsPage />} />

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

// Helper component to extract listing or items from state for Checkout
const CheckoutWrapper: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const listing = location.state?.listing;
  const items = location.state?.items;

  if (!listing && !items) return <Navigate to="/marketplace" replace />;

  return (
    <Checkout 
      listing={listing} 
      items={items}
      onSuccess={() => navigate('/orders')} 
      onCancel={() => navigate(-1)} 
    />
  );
};

const App: React.FC = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AppRoutes />
  </BrowserRouter>
);

export default App;
