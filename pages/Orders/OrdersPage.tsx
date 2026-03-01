
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
    if (!confirm("Confirm delivery?")) return;
    try {
      await db.updateOrderStatus(orderId, 'completed');
      load();
    } catch (err) {
      alert("Error processing confirmation.");
    }
  };

  if (loading && orders.length === 0) return (
    <div className="h-screen flex items-center justify-center bg-savvy-bg dark:bg-savvy-dark">
      <div className="w-8 h-8 border-2 border-savvy-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-24 md:py-40 pb-32">
      <header className="mb-8 md:mb-16 reveal">
        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-savvy-accent mb-2">Order History</p>
        <h1 className="text-3xl md:text-7xl font-black dark:text-white tracking-tighter uppercase">Purchases.</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        {orders.length === 0 ? (
          <div className="col-span-full py-20 text-center opacity-30 reveal">
            <p className="text-sm font-black uppercase tracking-widest dark:text-white">No active acquisitions</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="reveal bg-white dark:bg-[#0c0c0e] rounded-2xl tibico-border p-4 flex gap-4 items-center shadow-sm">
              <div className="w-16 h-20 rounded-xl overflow-hidden bg-gray-50 dark:bg-white/5 flex-shrink-0">
                <img src={order.image_url} className="w-full h-full object-cover" alt="img" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-[11px] font-black dark:text-white tracking-tight truncate leading-tight pr-2">{order.product_title}</h3>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest ${
                    order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-savvy-accent/10 text-savvy-accent'
                  }`}>
                    {order.status}
                  </span>
                </div>
                
                <p className="text-[10px] font-black text-savvy-accent mb-3">{order.amount} ETB</p>
                
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Seller</p>
                    <p className="text-[9px] font-bold dark:text-white truncate">{order.seller_name}</p>
                  </div>
                  {order.status === 'accepted' && (
                    <button onClick={() => handleConfirmReceipt(order.id)} className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[7px] font-black uppercase tracking-widest shadow-md">
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
