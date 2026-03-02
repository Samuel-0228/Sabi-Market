
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const [listings, orders] = await Promise.all([
        db.getUserListings(user.id, signal),
        db.getOrders(user.id, 'seller', signal)
      ]);
      setData({ listings, orders });
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error("Dashboard error", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const handleDelete = async (listingId: string) => {
    if (!window.confirm("Are you sure you want to delete this listing? This action is permanent for the marketplace but will be archived in our records.")) return;
    
    try {
      await db.deleteListing(listingId);
      addToast("Listing removed successfully", "success");
      load();
    } catch (err: any) {
      addToast(err.message || "Failed to delete listing", "error");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [user.id, load]);

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
        <header className="mb-8 md:mb-20 reveal">
          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-savvy-accent mb-2">Trade Console</p>
          <h1 className="text-3xl md:text-7xl font-black tracking-tighter uppercase leading-[1] dark:text-white">
            My <span className="font-serif italic text-savvy-accent lowercase tracking-normal">Store.</span>
          </h1>
        </header>

        {/* Stats Grid - High Density */}
        <div className="grid grid-cols-3 gap-px bg-black/5 dark:bg-white/5 tibico-border rounded-2xl overflow-hidden mb-8 md:mb-16">
           <StatCard label="Yield" value={stats.revenue} unit="ETB" />
           <StatCard label="Active" value={stats.active} unit="Items" />
           <StatCard label="Pending" value={stats.pending} unit="Reqs" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Inventory List */}
           <div className="reveal delay-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest dark:text-white">Active Inventory</h3>
                <span className="text-[8px] font-bold text-gray-400 uppercase">{data.listings.length} Units</span>
              </div>
              <div className="space-y-2">
                {data.listings.map(l => (
                  <div key={l.id} className="p-3 bg-white dark:bg-white/5 rounded-xl tibico-border flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <img src={l.image_url} className="w-8 h-8 rounded-lg object-cover" alt="p" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-tight dark:text-white truncate max-w-[100px]">{l.title}</p>
                        <p className="text-[7px] font-bold text-gray-400 uppercase">{l.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-[11px] font-black dark:text-white">{l.price} <span className="text-[7px]">ETB</span></p>
                      <button 
                        onClick={() => handleDelete(l.id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Listing"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
                {data.listings.length === 0 && <p className="text-[10px] text-gray-400 italic py-4">No items listed yet.</p>}
              </div>
           </div>

           {/* Sales Log */}
           <div className="reveal delay-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest dark:text-white">Sales Activity</h3>
                <span className="text-[8px] font-bold text-gray-400 uppercase">Recent</span>
              </div>
              <div className="space-y-2">
                 {data.orders.map(o => (
                   <div key={o.id} className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-between">
                     <div className="min-w-0">
                       <p className="text-[10px] font-black uppercase tracking-tight truncate">{o.product_title}</p>
                       <p className="text-[7px] font-black uppercase tracking-[0.1em] opacity-60">Status: {o.status}</p>
                     </div>
                     <p className="text-[11px] font-black">{o.amount} <span className="text-[7px]">ETB</span></p>
                   </div>
                 ))}
                 {data.orders.length === 0 && <p className="text-[10px] text-gray-400 italic py-4">No sales history yet.</p>}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, unit }: any) => (
  <div className="bg-white dark:bg-savvy-dark p-4 md:p-10 flex flex-col justify-center text-center">
    <p className="text-[7px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
    <h4 className="text-sm md:text-4xl font-black dark:text-white tracking-tighter truncate">{value}</h4>
    <p className="text-[6px] md:text-[8px] font-black text-savvy-accent uppercase mt-1">{unit}</p>
  </div>
);

export default SellerDashboard;
