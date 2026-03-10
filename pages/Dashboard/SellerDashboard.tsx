
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../services/supabase/db';
import { ratingService } from '../../services/ratingService';
import { Listing, UserProfile, OrderStatus } from '../../types/index';
import { useLanguage } from '../../app/LanguageContext';
import { useUIStore } from '../../store/ui.store';
import RatingModal from '../../components/ui/RatingModal';

interface SellerDashboardProps {
  user: UserProfile;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ user }) => {
  const { t } = useLanguage();
  const { addToast } = useUIStore();
  const [data, setData] = useState<{listings: Listing[], orders: any[]}>({ listings: [], orders: [] });
  const [loading, setLoading] = useState(true);
  const [ratingOrder, setRatingOrder] = useState<any>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const [listings, orders] = await Promise.all([
        db.getUserListings(user.id, signal),
        db.getOrders(user.id, 'seller', signal)
      ]);
      
      setData({ listings, orders });

      // Automatic tracing: Mark 'not_seen' orders as 'pending'
      const unseenOrders = orders.filter((o: any) => o.status === 'not_seen');
      if (unseenOrders.length > 0) {
        await Promise.all(unseenOrders.map((o: any) => db.updateOrderStatus(o.id, 'pending')));
        // Re-fetch to get updated statuses
        const updatedOrders = await db.getOrders(user.id, 'seller', signal);
        setData(prev => ({ ...prev, orders: updatedOrders }));
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error("Dashboard error", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await db.updateOrderStatus(orderId, status);
      addToast(`Order marked as ${status}`, "success");
      load();
    } catch (err: any) {
      addToast("Failed to update order", "error");
    }
  };

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!ratingOrder) return;
    try {
      await ratingService.createRating({
        order_id: ratingOrder.id,
        reviewer_id: user.id,
        reviewee_id: ratingOrder.buyer_id,
        rating,
        comment
      });
      addToast("Buyer rated successfully!", "success");
    } catch (error) {
      console.error("Rating failed", error);
      addToast("Failed to submit rating", "error");
    }
  };

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
    revenue: data.orders.reduce((acc: number, o: any) => acc + (o.status === 'closed' || o.status === 'completed' ? parseFloat(o.amount) : 0), 0),
    active: data.listings.length,
    pending: data.orders.filter((o: any) => o.status === 'pending' || o.status === 'not_seen').length
  }), [data]);

  if (loading) return <div className="h-screen bg-savvy-surface flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-savvy-accent border-t-transparent rounded-full animate-spin" />
  </div>;

  return (
    <div className="bg-savvy-surface min-h-screen pt-24 md:pt-48 px-4 md:px-10 pb-32">
      <div className="max-w-[1200px] mx-auto">
        <header className="mb-8 md:mb-20 reveal">
          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-savvy-accent mb-2">Trade Console</p>
          <h1 className="text-3xl md:text-7xl font-black tracking-tighter uppercase leading-[1] text-savvy-text">
            My <span className="font-serif italic text-savvy-accent lowercase tracking-normal">Store.</span>
          </h1>
        </header>

        {/* Stats Grid - High Density */}
        <div className="grid grid-cols-3 gap-px bg-black/5 dark:bg-white/5 tibico-border rounded-2xl overflow-hidden mb-8 md:mb-16">
           <StatCard label="Yield" value={stats.revenue} unit="ETB" />
           <StatCard label="Active" value={stats.active} unit="Items" />
           <StatCard label="Pending" value={stats.pending} unit="Reqs" />
        </div>

        <div className="flex flex-col gap-12">
           {/* Inventory List */}
           <div className="reveal delay-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-savvy-text border-l-4 border-savvy-accent pl-4">Active Inventory</h3>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-4 py-1 rounded-full">{data.listings.length} Units</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.listings.map(l => (
                  <div key={l.id} className="p-4 bg-white dark:bg-[#0c0c0e] rounded-2xl tibico-border flex items-center justify-between group hover:shadow-xl transition-all duration-500">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 dark:bg-white/5">
                        <img src={l.image_url} className="w-full h-full object-cover" alt="p" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-tight text-savvy-text truncate max-w-[150px]">{l.title}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{l.category.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="text-sm font-black text-savvy-text tracking-tighter">{l.price} <span className="text-[8px] text-gray-400">ETB</span></p>
                      <button 
                        onClick={() => handleDelete(l.id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Listing"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
                {data.listings.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-white dark:bg-white/5 rounded-3xl border-2 border-dashed border-black/5 dark:border-white/5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No items listed yet.</p>
                  </div>
                )}
              </div>
           </div>

           {/* Sales Activity - Professional Tracking */}
           <div className="reveal delay-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-savvy-text border-l-4 border-savvy-indigo pl-4">Sales Activity</h3>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-4 py-1 rounded-full">Recent Trades</span>
              </div>
              <div className="space-y-4">
                  {data.orders.map(o => (
                    <div key={o.id} className="p-6 bg-white dark:bg-[#0c0c0e] rounded-[2rem] tibico-border flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl transition-all duration-500 group">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 shrink-0">
                          <img src={o.image_url} className="w-full h-full object-cover" alt="p" referrerPolicy="no-referrer" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-sm font-black uppercase tracking-tight text-savvy-text truncate max-w-[200px]">{o.product_title}</h4>
                            <StatusBadge status={o.status} />
                          </div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Buyer: {o.buyer_name}</p>
                          <p className="text-[8px] font-medium text-gray-400 line-clamp-1 italic">"{o.delivery_info}"</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0 border-black/5 dark:border-white/5">
                        <div className="text-right">
                          <p className="text-xl font-black text-savvy-text tracking-tighter">{o.amount} <span className="text-[10px] text-gray-400">ETB</span></p>
                          <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Trade Value</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center justify-end gap-3">
                          {o.status === 'pending' && (
                            <button 
                              onClick={() => handleUpdateStatus(o.id, 'accepted')}
                              className="px-4 py-2 bg-savvy-accent text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                              Accept Trade
                            </button>
                          )}
                          
                          {o.status === 'accepted' && (
                            <button 
                              onClick={() => handleUpdateStatus(o.id, 'shipped')}
                              className="px-4 py-2 bg-blue-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                              Mark as Shipped
                            </button>
                          )}

                          {o.status === 'shipped' && (
                            <button 
                              onClick={() => handleUpdateStatus(o.id, 'delivered')}
                              className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                              Mark as Delivered
                            </button>
                          )}
                          
                          {o.status === 'completed' && (
                            <button 
                              onClick={() => setRatingOrder(o)}
                              className="px-4 py-2 border border-savvy-accent text-savvy-accent rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-savvy-accent hover:text-white transition-all"
                            >
                              Rate Buyer
                            </button>
                          )}

                          {o.status === 'closed' && (
                            <div className="px-4 py-2 bg-green-500/10 text-green-500 rounded-xl text-[8px] font-black uppercase tracking-widest border border-green-500/20">
                              Completed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                 {data.orders.length === 0 && (
                   <div className="py-20 text-center bg-white dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-black/5 dark:border-white/5">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No sales history yet.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      <RatingModal
        isOpen={!!ratingOrder}
        onClose={() => setRatingOrder(null)}
        onSubmit={handleRatingSubmit}
        title="Rate Buyer"
        subtitle={`How was your experience with ${ratingOrder?.buyer_name}?`}
      />
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const config: any = {
    not_seen: { label: 'Not Seen', class: 'bg-red-500/10 text-red-500 border-red-500/20' },
    pending: { label: 'Pending', class: 'bg-savvy-indigo/10 text-savvy-indigo border-savvy-indigo/20' },
    accepted: { label: 'Accepted', class: 'bg-savvy-accent/10 text-savvy-accent border-savvy-accent/20' },
    shipped: { label: 'Shipped', class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    delivered: { label: 'Delivered', class: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    completed: { label: 'Completed', class: 'bg-green-500/10 text-green-500 border-green-500/20' },
    closed: { label: 'Closed', class: 'bg-green-500/10 text-green-500 border-green-500/20' },
    cancelled: { label: 'Cancelled', class: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  };

  const s = config[status] || { label: status, class: 'bg-gray-100 text-gray-400' };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border ${s.class}`}>
      {s.label}
    </span>
  );
};

const StatCard = ({ label, value, unit }: any) => (
  <div className="bg-savvy-surface p-4 md:p-10 flex flex-col justify-center text-center">
    <p className="text-[7px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
    <h4 className="text-sm md:text-4xl font-black text-savvy-text tracking-tighter truncate">{value}</h4>
    <p className="text-[6px] md:text-[8px] font-black text-savvy-accent uppercase mt-1">{unit}</p>
  </div>
);

export default SellerDashboard;
