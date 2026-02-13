
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/supabase/db';
import { Listing, UserProfile } from '../../types/index';
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

  if (loading) return <div className="h-screen bg-savvy-bg dark:bg-savvy-dark flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-savvy-accent border-t-transparent rounded-full animate-spin" />
  </div>;

  return (
    <div className="bg-savvy-bg dark:bg-savvy-dark min-h-screen pt-24 md:pt-48 px-4 md:px-10 pb-32">
      <div className="max-w-[1200px] mx-auto">
        <header className="mb-12 md:mb-20 reveal">
          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-savvy-accent mb-4">Trade Dashboard</p>
          <h1 className="text-4xl md:text-8xl font-black tracking-tighter uppercase leading-[1] mb-6 dark:text-white">
            Seller <span className="font-serif italic text-savvy-accent lowercase tracking-normal">Console.</span>
          </h1>
        </header>

        {/* Responsive Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-px bg-black/10 dark:bg-white/10 tibico-border rounded-2xl md:rounded-[3rem] overflow-hidden mb-12 md:mb-24">
           <StatCard label="Yield" value={stats.revenue} unit="ETB" />
           <StatCard label="Active" value={stats.active} unit="Units" />
           <StatCard label="Pending" value={stats.pending} unit="Reqs" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
           <div className="reveal delay-2">
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter dark:text-white mb-6">Inventory</h3>
              <div className="space-y-3">
                {data.listings.map(l => (
                  <div key={l.id} className="p-4 bg-white dark:bg-white/5 rounded-2xl tibico-border flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <img src={l.image_url} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-tight dark:text-white truncate max-w-[120px]">{l.title}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{l.category}</p>
                      </div>
                    </div>
                    <p className="text-sm font-black dark:text-white">{l.price} ETB</p>
                  </div>
                ))}
              </div>
           </div>

           <div className="reveal delay-3">
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter dark:text-white mb-6">Trade Log</h3>
              <div className="space-y-3">
                 {data.orders.map(o => (
                   <div key={o.id} className="p-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-between">
                     <div className="min-w-0">
                       <p className="text-xs font-black uppercase tracking-tight truncate">{o.product_title}</p>
                       <p className="text-[8px] font-black uppercase tracking-[0.1em] opacity-60">{o.status}</p>
                     </div>
                     <p className="text-sm font-black">{o.amount} ETB</p>
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
  <div className="bg-white dark:bg-savvy-dark p-6 md:p-12 flex flex-col justify-center text-center md:text-left">
    <p className="text-[7px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">{label}</p>
    <div className="flex items-baseline justify-center md:justify-start gap-1 md:gap-2">
      <h4 className="text-xl md:text-5xl font-black dark:text-white tracking-tighter">{value}</h4>
      <span className="text-[7px] md:text-[9px] font-black text-savvy-accent uppercase">{unit}</span>
    </div>
  </div>
);

export default SellerDashboard;
