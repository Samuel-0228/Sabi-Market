
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

  const load = async (signal?: AbortSignal) => {
    try {
      const [listings, orders] = await Promise.all([
        db.getListings(signal).then(all => all.filter((l: Listing) => l.seller_id === user.id)),
        db.getOrders(user.id, 'seller', signal)
      ]);
      setData({ listings, orders });
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
    revenue: data.orders.reduce((acc: number, o: any) => acc + (o.status === 'completed' ? parseFloat(o.amount) : 0), 0),
    active: data.listings.length,
    pending: data.orders.filter((o: any) => o.status === 'pending').length
  }), [data]);

  if (loading) return <div className="h-screen bg-savvy-bg dark:bg-savvy-dark" />;

  return (
    <div className="bg-savvy-bg dark:bg-savvy-dark min-h-screen pt-48 px-10 pb-32">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-40 reveal">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-savvy-accent mb-8">Trade Intelligence</p>
          <h1 className="text-8xl md:text-[10rem] font-black tracking-tighter uppercase leading-[0.8] mb-12 dark:text-white">
            Seller <br /> <span className="font-serif italic text-savvy-accent lowercase tracking-normal">Console.</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1px bg-black/10 dark:bg-white/10 tibico-border rounded-[4rem] overflow-hidden reveal delay-1 mb-40">
           <StatCard label="Total Yield" value={stats.revenue} unit="ETB" />
           <StatCard label="Active Items" value={stats.active} unit="Units" />
           <StatCard label="Pending Trade" value={stats.pending} unit="Requests" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
           <div className="reveal delay-2">
              <h3 className="text-3xl font-black uppercase tracking-tighter dark:text-white mb-12">Inventory Node</h3>
              <div className="space-y-6">
                {data.listings.map(l => (
                  <div key={l.id} className="p-8 bg-white dark:bg-white/5 rounded-[2.5rem] tibico-border flex items-center justify-between group hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
                    <div className="flex items-center gap-6">
                      <img src={l.image_url} className="w-16 h-16 rounded-2xl object-cover" />
                      <div>
                        <p className="text-lg font-black uppercase tracking-tight">{l.title}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{l.category}</p>
                      </div>
                    </div>
                    <p className="text-xl font-black">{l.price} ETB</p>
                  </div>
                ))}
              </div>
           </div>

           <div className="reveal delay-3">
              <h3 className="text-3xl font-black uppercase tracking-tighter dark:text-white mb-12">Transaction Log</h3>
              <div className="space-y-6">
                 {data.orders.map(o => (
                   <div key={o.id} className="p-8 bg-black dark:bg-white text-white dark:text-black rounded-[2.5rem] flex items-center justify-between">
                     <div>
                       <p className="text-lg font-black uppercase tracking-tight">{o.product_title}</p>
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Status: {o.status}</p>
                     </div>
                     <p className="text-2xl font-black tracking-tighter">{o.amount} ETB</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, unit }: any) => (
  <div className="bg-white dark:bg-savvy-dark p-20 flex flex-col justify-center">
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-12">{label}</p>
    <div className="flex items-baseline gap-4">
      <h4 className="text-7xl font-black dark:text-white tracking-tighter">{value}</h4>
      <span className="text-[11px] font-black text-savvy-accent uppercase tracking-widest">{unit}</span>
    </div>
  </div>
);

export default SellerDashboard;
