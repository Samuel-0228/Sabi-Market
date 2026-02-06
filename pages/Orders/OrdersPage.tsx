
import React, { useEffect, useState } from 'react';
import { useOrdersStore } from '../../store/orders.store';
import { UserProfile } from '../../types/index';
import { useLanguage } from '../../app/LanguageContext';

interface OrdersPageProps {
  user: UserProfile;
}

const OrdersPage: React.FC<OrdersPageProps> = ({ user }) => {
  const { t } = useLanguage();
  const { items: orders, loading, fetch } = useOrdersStore();
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetch(user.id);
    }
  }, [user?.id, fetch]);

  // Monitor loading time to offer a manual refresh if it takes > 4 seconds
  useEffect(() => {
    let timer: any;
    if (loading && orders.length === 0) {
      timer = setTimeout(() => setShowSlowMessage(true), 4000);
    } else {
      setShowSlowMessage(false);
    }
    return () => clearTimeout(timer);
  }, [loading, orders.length]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
      case 'accepted': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400';
      case 'shipped': return 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400';
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 animate-pulse">Syncing Trades...</p>
        
        {showSlowMessage && (
          <div className="mt-8 animate-in slide-in-from-bottom duration-500">
            <p className="text-xs text-gray-400 italic mb-4">Database response is taking longer than expected...</p>
            <button 
              onClick={() => fetch(user.id, true)} 
              className="px-6 py-3 bg-gray-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest dark:text-white hover:bg-indigo-600 hover:text-white transition-all"
            >
              Force Refresh
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-20 animate-in fade-in duration-700">
      <header className="mb-16 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-6xl font-black text-black dark:text-white tracking-tighter mb-4">{t('myOrders')}</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg italic">Track your secure campus exchanges.</p>
        </div>
        <button 
          onClick={() => fetch(user.id, true)}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-gray-50 dark:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest dark:text-white hover:bg-gray-100 transition-all"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          {loading ? 'Updating...' : 'Refresh'}
        </button>
      </header>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="py-40 text-center opacity-30 flex flex-col items-center">
            <span className="text-6xl mb-6">🛍️</span>
            <p className="text-sm font-black uppercase tracking-widest dark:text-white">No trade history found</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm p-8 flex flex-col md:flex-row gap-8 items-center group hover:border-indigo-500/30 transition-all">
              <div className="w-full md:w-32 aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 shadow-inner flex-shrink-0">
                {order.image_url ? (
                  <img src={order.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={order.product_title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-2xl font-black dark:text-white tracking-tight leading-none truncate">{order.product_title}</h3>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                
                <p className="text-sm font-bold text-indigo-600 mb-4">{order.amount} ETB</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Seller</p>
                    <p className="text-sm font-bold dark:text-white">{order.seller_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Trade Details</p>
                    <p className="text-xs font-medium dark:text-gray-300 italic truncate">{order.delivery_info || 'Meetup info not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col gap-2 flex-shrink-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trade ID</p>
                <p className="text-[10px] font-bold dark:text-white opacity-40">{order.id.slice(0, 8)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
