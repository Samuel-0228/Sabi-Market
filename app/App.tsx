
import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/auth.store';
import { supabase } from '../shared/lib/supabase';

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

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized) return null; // Wait for auth sync

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, initialized, sync, forceInitialize } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    sync();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (['SIGNED_IN', 'USER_UPDATED', 'TOKEN_REFRESHED'].includes(event)) {
        await sync();
      }
      if (event === 'SIGNED_OUT') {
        useAuthStore.getState().setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [sync]);

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
          className="px-8 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-indigo-600 hover:border-indigo-600/30 transition-all active:scale-95"
        >
          System Override
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col dark:bg-[#050505] selection:bg-indigo-600 selection:text-white">
      <Navbar />
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
                <Checkout listing={null as any} onSuccess={() => {}} onCancel={() => {}} />
              </ProtectedRoute>
            } />

            {/* Fallback */}
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

const App: React.FC = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);

export default App;
