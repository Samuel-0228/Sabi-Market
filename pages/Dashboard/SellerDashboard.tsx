
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/supabase/db';
import { Listing, UserProfile, OrderStatus } from '../../types/index';
import { useLanguage } from '../../app/LanguageContext';
import { useUIStore } from '../../store/ui.store';

interface SellerDashboardProps {
  user: UserProfile;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ user }) => {
  const { t } = useLanguage();
  const { addToast } = useUIStore();
  const [data, setData] = useState<{listings: Listing[], orders: any[]}>({ listings: [], orders: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');

  const load = async (signal?: AbortSignal) => {
    try {
      const result = await db.getSellerDashboardData(user.id, signal);
      setData(result);
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error("Dashboard error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [user.id]);

  const stats = useMemo(() => ({
    revenue: data.orders.reduce((acc, o) => acc + (o.status === 'completed' ? parseFloat(o.amount) : 0), 0),
    active: data.listings.length,
    pending: data.orders.filter(o => o.status === 'pending').length
  }), [data]);

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await db.updateOrderStatus(orderId, status);
      addToast(`Order status updated to ${status}`, "success");
      load();
    } catch (err) {
      addToast("Failed to update status", "error");
    }
  };

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center">
       <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
       <p className="text-[10px] font-black uppercase tracking-widest opacity-40 dark:text-white">Syncing Command Center...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-20 animate-in fade-in duration-700">
      <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <h1 className="text-6xl font-black dark:text-white tracking-tighter mb-4">Command Center.</h1>
          <p className="text-gray-500 font-medium text-lg italic">Monitor your campus trades.</p>
        </div>
        <div className="flex bg-gray-50 dark:bg-white/5 p-2 rounded-2xl border border-gray-100 dark:border-white/5">
          <button onClick={() => setActiveTab('inventory')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white dark:bg-white/10 dark:text-white shadow-sm' : 'text-gray-400'}`}>Inventory</button>
          <button onClick={() => setActiveTab('orders')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-white dark:bg-white/10 dark:text-white shadow-sm' : 'text-gray-400'}`}>Trades</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <StatCard label="Total Revenue" value={stats.revenue} unit="ETB" color="text-indigo-600" />
        <StatCard label="Active Items" value={stats.active} unit="Units" color="text-black dark:text-white" />
        <StatCard label="Pending Action" value={stats.pending} unit="Trades" color="text-pink-600" />
      </div>

      <div className="bg-white dark:bg-[#0c0c0e] p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm">
        {activeTab === 'inventory' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {data.listings.length === 0 ? (
               <div className="col-span-full py-20 text-center opacity-20">
                 <p className="text-4xl mb-4">📦</p>
                 <p className="font-black uppercase tracking-widest dark:text-white">No active listings</p>
               </div>
            ) : (
              data.listings.map(l => (
                <div key={l.id} className="group">
                  <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-4 bg-gray-50 dark:bg-white/5 shadow-inner">
                    <img src={l.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <p className="font-black dark:text-white truncate">{l.title}</p>
                  <p className="text-sm font-bold text-indigo-500">{l.price} ETB</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {data.orders.length === 0 ? (
               <div className="col-span-full py-20 text-center opacity-20">
                 <p className="text-4xl mb-4">🤝</p>
                 <p className="font-black uppercase tracking-widest dark:text-white">No trade inquiries yet</p>
               </div>
            ) : (
              data.orders.map(o => (
                <div key={o.id} className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-gray-50/50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 transition-all hover:border-indigo-500/30">
                  <div className="flex items-center gap-6">
                    <img src={o.image_url} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                    <div className="min-w-0">
                      <p className="font-black dark:text-white text-lg leading-none mb-2 truncate">{o.product_title}</p>
                      <p className="text-xs font-bold text-gray-400">Buyer: <span className="text-indigo-500">{o.buyer_name}</span></p>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-col md:items-end gap-3">
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-black text-indigo-600">{o.amount} ETB</p>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        o.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                        o.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {o.status}
                      </span>
                    </div>
                    {o.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateStatus(o.id, 'accepted')} className="px-4 py-2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">Accept</button>
                        <button onClick={() => handleUpdateStatus(o.id, 'cancelled')} className="px-4 py-2 bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-lg">Decline</button>
                      </div>
                    )}
                    {o.status === 'accepted' && (
                      <button onClick={() => handleUpdateStatus(o.id, 'completed')} className="px-4 py-2 bg-green-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">Mark as Delivered</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, unit, color }: any) => (
  <div className="bg-white dark:bg-[#0c0c0e] p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5">
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{label}</p>
    <div className="flex items-baseline gap-2">
      <h4 className={`text-4xl font-black tracking-tighter ${color}`}>{value}</h4>
      <span className="text-[10px] font-bold text-gray-400 uppercase">{unit}</span>
    </div>
  </div>
);

export default SellerDashboard;
