
import React, { useState, useEffect } from 'react';
import { db } from '../../services/supabase/db';
// Fix: Use index.ts instead of index.d.ts to access OrderItem and consistent OrderStatus types
import { Listing, OrderItem, UserProfile } from '../../types/index';
import { useLanguage } from '../../app/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SellerDashboardProps {
  user: UserProfile;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ user }) => {
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, activeListings: 0, pendingOrders: 0 });
  const [chartReady, setChartReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');

  useEffect(() => {
    loadData();
    const timer = setTimeout(() => setChartReady(true), 500);
    return () => clearTimeout(timer);
  }, [user]);

  const loadData = async () => {
    try {
      const allListings = await db.getListings();
      const myListings = allListings.filter(l => l.seller_id === user.id);
      const items = await db.getSellerOrderItems();

      setListings(myListings);
      setOrderItems(items);

      const totalSales = items.reduce((acc, i) => acc + (i.status === 'completed' ? i.price : 0), 0);
      setStats({
        totalSales,
        activeListings: myListings.length,
        pendingOrders: items.filter(i => i.status === 'pending').length
      });
    } catch (err) {
      console.error("Dashboard load failed", err);
    }
  };

  const updateStatus = async (itemId: string, newStatus: string) => {
    try {
      await db.updateOrderItemStatus(itemId, newStatus);
      setOrderItems(prev => prev.map(item => item.id === itemId ? { ...item, status: newStatus as any } : item));
    } catch (err) {
      alert("Update failed");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
      case 'accepted': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400';
      case 'shipped': return 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-20 animate-in fade-in duration-700">
      <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <h1 className="text-6xl font-black text-black dark:text-white tracking-tighter mb-4">{t('commandCenter')}</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Control your trades and track performance.</p>
        </div>
        <div className="flex bg-gray-50 dark:bg-white/5 p-2 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white dark:bg-white/10 dark:text-white shadow-sm' : 'text-gray-400'}`}
          >
            Inventory
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-white dark:bg-white/10 dark:text-white shadow-sm' : 'text-gray-400'}`}
          >
            Incoming Orders
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {[
          { label: 'Market Revenue', val: stats.totalSales, unit: 'ETB', color: 'text-indigo-600' },
          { label: 'Live Listings', val: stats.activeListings, unit: 'Items', color: 'text-black dark:text-white' },
          { label: 'Pending Action', val: stats.pendingOrders, unit: 'Orders', color: 'text-pink-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#0c0c0e] p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{s.label}</p>
            <div className="flex items-baseline gap-2">
              <h4 className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.val}</h4>
              <span className="text-[10px] font-bold text-gray-400 uppercase">{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'inventory' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 bg-white dark:bg-[#0c0c0e] p-10 rounded-[3rem] border border-gray-100 dark:border-white/5">
            <h3 className="text-xl font-black mb-10 tracking-tight dark:text-white">Active Listings</h3>
            <div className="space-y-6">
              {listings.map(l => (
                <div key={l.id} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                  <img src={l.image_url} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1">
                    <p className="font-black dark:text-white">{l.title}</p>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{l.price} ETB</p>
                  </div>
                  <button className="text-[10px] font-black text-gray-400 uppercase hover:text-red-500">Delete</button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-[#0c0c0e] p-10 rounded-[3rem] border border-gray-100 dark:border-white/5">
            <h3 className="text-xl font-black mb-10 tracking-tight dark:text-white">Performance</h3>
            <div className="h-64">
               {chartReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{name: 'Goal', val: 5000}, {name: 'Sales', val: stats.totalSales}]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Bar dataKey="val" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="animate-pulse h-full bg-gray-50 dark:bg-white/5 rounded-2xl" />}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0c0c0e] p-10 rounded-[3.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b dark:border-white/5">
                  <th className="pb-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ordered Product</th>
                  <th className="pb-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                  <th className="pb-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="pb-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="pb-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/5">
                {orderItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center opacity-30 font-black uppercase tracking-widest">No orders yet</td>
                  </tr>
                ) : (
                  orderItems.map((item) => (
                    <tr key={item.id} className="group">
                      <td className="py-8">
                        <p className="font-black dark:text-white leading-none mb-1">{item.product_title}</p>
                        <p className="text-[9px] font-medium text-gray-400 italic">Snapshot ID: {item.id.slice(0, 8)}</p>
                      </td>
                      <td className="py-8">
                        <p className="font-bold dark:text-white text-sm">{item.buyer_name}</p>
                      </td>
                      <td className="py-8">
                        <p className="font-black text-indigo-600">{item.price} ETB</p>
                      </td>
                      <td className="py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-8 text-right">
                        <div className="flex justify-end gap-2">
                          {item.status === 'pending' && (
                            <button 
                              onClick={() => updateStatus(item.id, 'accepted')}
                              className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                            >
                              Accept
                            </button>
                          )}
                          {item.status === 'accepted' && (
                            <button 
                              onClick={() => updateStatus(item.id, 'shipped')}
                              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                            >
                              Shipped
                            </button>
                          )}
                          {item.status === 'shipped' && (
                            <button 
                              onClick={() => updateStatus(item.id, 'completed')}
                              className="bg-green-600 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                            >
                              Finish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
