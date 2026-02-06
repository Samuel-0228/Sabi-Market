
import React, { useEffect, useState } from 'react';
import { db } from '../../services/supabase/db';
import { UserProfile, OrderStatus } from '../../types/index';
import { useLanguage } from '../../app/LanguageContext';

interface OrdersPageProps {
  user: UserProfile;
}

const OrdersPage: React.FC<OrdersPageProps> = ({ user }) => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (signal?: AbortSignal) => {
    try {
      const data = await db.getOrders(user.id, 'buyer', signal);
      setOrders(data);
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error("Orders load failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [user.id]);

  const handleConfirmReceipt = async (orderId: string) => {
    if (!confirm("Did you receive the item and are satisfied with it? This releases the payment to the seller.")) return;
    try {
      await db.updateOrderStatus(orderId, 'completed');
      load();
    } catch (err) {
      alert("Action failed. Check your connection.");
    }
  };

  if (loading && orders.length === 0) return (
    <div className="h-[80vh] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 dark:text-white">Syncing your history...</p>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-20 animate-in fade-in duration-700">
      <header className="mb-16">
        <h1 className="text-6xl font-black dark:text-white tracking-tighter mb-4">Trade History.</h1>
        <p className="text-gray-500 text-lg italic font-medium">Tracking your secure AAU campus trades.</p>
      </header>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="py-40 text-center opacity-20">
            <p className="text-6xl mb-6">🛍️</p>
            <p className="text-sm font-black uppercase tracking-widest dark:text-white">No trade history yet</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 flex flex-col md:flex-row gap-8 items-center shadow-sm hover:border-indigo-500/30 transition-all">
              <div className="w-full md:w-32 aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 flex-shrink-0">
                <img src={order.image_url} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-black dark:text-white tracking-tight truncate">{order.product_title}</h3>
                  <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    order.status === 'completed' ? 'bg-green-100 text-green-600' : 
                    order.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {order.status}
                  </span>
                </div>
                
                <p className="text-lg font-black text-indigo-600 mb-6">{order.amount} ETB</p>
                
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Seller</p>
                    <p className="text-sm font-bold dark:text-white">{order.seller_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Meetup</p>
                    <p className="text-xs font-medium dark:text-gray-400 italic truncate">{order.delivery_info}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-3 shrink-0">
                {order.status === 'accepted' && (
                  <button onClick={() => handleConfirmReceipt(order.id)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Confirm Delivery</button>
                )}
                {order.status === 'pending' && (
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Awaiting Seller Confirmation</p>
                )}
                <span className="text-[9px] font-bold text-gray-400">Order ID: {order.id.slice(0, 8)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
