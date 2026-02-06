
import React, { useEffect } from 'react';
import { useOrdersStore } from '../../store/orders.store';
import { UserProfile } from '../../types/index';
import { useLanguage } from '../../app/LanguageContext';

interface OrdersPageProps {
  user: UserProfile;
}

const OrdersPage: React.FC<OrdersPageProps> = ({ user }) => {
  const { t } = useLanguage();
  const { items: orders, loading, fetch } = useOrdersStore();

  useEffect(() => {
    // Only attempt fetch if user is verified
    if (user?.id && user.is_verified) {
      fetch(user.id);
    }
  }, [user?.id, user?.is_verified, fetch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
      case 'accepted': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400';
      case 'shipped': return 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400';
    }
  };

  // ACCESS POLICY VIEW: Restriction for unverified users
  if (!user.is_verified) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/10 rounded-[2.5rem] flex items-center justify-center text-5xl mb-10 shadow-inner">🏦</div>
        <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter mb-4">Orders Restricted</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium max-w-sm italic leading-relaxed">
          Escrow and transaction history are high-security areas. Please verify your <span className="text-indigo-600 font-bold">@aau.edu.et</span> identity to continue.
        </p>
        <div className="mt-12 flex gap-4">
          <button className="btn-hope px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">
            Verify Now
          </button>
        </div>
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 dark:text-white">Retrieving Orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-20 animate-in fade-in duration-700">
      <header className="mb-16">
        <h1 className="text-6xl font-black text-black dark:text-white tracking-tighter mb-4">{t('myOrders')}</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg italic">Track your campus trades and secure exchanges.</p>
      </header>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="py-40 text-center opacity-30 flex flex-col items-center">
            <span className="text-6xl mb-6">🛍️</span>
            <p className="text-sm font-black uppercase tracking-widest dark:text-white">No trade history found yet</p>
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
                  <h3 className="text-2xl font-black dark:text-white tracking-tight leading-none">{order.product_title}</h3>
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
