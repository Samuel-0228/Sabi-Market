
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/supabase/db';
import { Listing, UserProfile } from '../../types/index';
import { useLanguage } from '../../app/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SellerDashboardProps {
  user: UserProfile;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ user }) => {
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, activeListings: 0, pendingOrders: 0 });
  const [chartReady, setChartReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');

  useEffect(() => {
    loadData();
    const timer = setTimeout(() => setChartReady(true), 200);
    return () => clearTimeout(timer);
  }, [user]);

  const loadData = async () => {
    try {
      const allListings = await db.getListings();
      const myListings = allListings.filter(l => l.seller_id === user.id);
      const items = await db.getSellerOrderItems();

      setListings(myListings);
      setOrders(items);

      const totalSales = items.reduce((acc, i) => acc + (i.status === 'completed' ? parseFloat(i.amount) : 0), 0);
      setStats({
        totalSales,
        activeListings: myListings.length,
        pendingOrders: items.filter(i => i.status === 'pending').length
      });
    } catch (err) {
      console.error("Dashboard load failed", err);
    }
  };

  const dynamicSalesData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        name: days[d.getDay()],
        dateStr: d.toISOString().split('T')[0],
        sales: 0
      };
    });

    orders.forEach(order => {
      if (order.status === 'completed') {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        const dataPoint = last7Days.find(d => d.dateStr === orderDate);
        if (dataPoint) {
          dataPoint.sales += parseFloat(order.amount);
        }
      }
    });

    return last7Days;
  }, [orders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await db.updateOrderItemStatus(orderId, newStatus);
      setOrders(prev => prev.map(item => item.id === orderId ? { ...item, status: newStatus } : item));
      // Refresh stats after status update
      loadData();
    } catch (err) {
      alert("Status update failed");
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
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg italic">Command your campus trades and monitor growth.</p>
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
            Active Trades
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {[
          { label: 'Market Revenue', val: stats.totalSales, unit: 'ETB', color: 'text-indigo-600' },
          { label: 'Active Listings', val: stats.activeListings, unit: 'Items', color: 'text-black dark:text-white' },
          { label: 'Pending Action', val: stats.pendingOrders, unit: 'Trades', color: 'text-pink-600' },
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
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black tracking-tight dark:text-white">Active Listings</h3>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{listings.length} items listed</span>
            </div>
            <div className="space-y-6">
              {listings.length === 0 ? (
                <div className="py-20 text-center opacity-20">
                  <p className="text-4xl mb-4">📦</p>
                  <p className="font-black uppercase text-xs tracking-widest dark:text-white">Empty Inventory</p>
                </div>
              ) : (
                listings.map(l => (
                  <div key={l.id} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
                    <img src={l.image_url} className="w-16 h-16 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" alt={l.title} />
                    <div className="flex-1">
                      <p className="font-black dark:text-white group-hover:text-indigo-500 transition-colors">{l.title}</p>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{l.price} ETB</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-[#0c0c0e] p-10 rounded-[3rem] border border-gray-100 dark:border-white/5">
            <h3 className="text-xl font-black mb-10 tracking-tight dark:text-white">Weekly Performance</h3>
            <div className="w-full h-64 min-h-[256px]">
               {chartReady ? (
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={dynamicSalesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 700}} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: 'rgba(99, 102, 241, 0.05)'}} 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: '#fff', fontSize: '10px'}} 
                      labelStyle={{fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase'}}
                      itemStyle={{fontWeight: 700, color: '#6366f1'}}
                    />
                    <Bar dataKey="sales" fill="#6366f1" radius={[6, 6, 6, 6]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full bg-gray-50 dark:bg-white/5 rounded-2xl animate-pulse" />
              )}
            </div>
            <div className="mt-8 pt-8 border-t dark:border-white/5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total Sales</p>
              <p className="text-2xl font-black dark:text-white">{stats.totalSales} ETB</p>
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
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center opacity-30 font-black uppercase tracking-widest dark:text-white">No active trades</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="group">
                      <td className="py-8">
                        <div className="flex items-center gap-4">
                           <img src={order.image_url} className="w-10 h-10 rounded-lg object-cover" alt="" />
                           <div>
                             <p className="font-black dark:text-white leading-none mb-1">{order.product_title}</p>
                             <p className="text-[9px] font-medium text-gray-400 italic">ID: {order.id.slice(0, 8)}</p>
                           </div>
                        </div>
                      </td>
                      <td className="py-8">
                        <p className="font-bold dark:text-white text-sm">{order.buyer_name}</p>
                      </td>
                      <td className="py-8">
                        <p className="font-black text-indigo-600">{order.amount} ETB</p>
                      </td>
                      <td className="py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-8 text-right">
                        <div className="flex justify-end gap-2">
                          {order.status === 'pending' && (
                            <button 
                              onClick={() => updateStatus(order.id, 'accepted')}
                              className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                            >
                              Accept
                            </button>
                          )}
                          {order.status === 'accepted' && (
                            <button 
                              onClick={() => updateStatus(order.id, 'shipped')}
                              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                            >
                              Shipped
                            </button>
                          )}
                          {order.status === 'shipped' && (
                            <button 
                              onClick={() => updateStatus(order.id, 'completed')}
                              className="bg-green-600 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                            >
                              Complete
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
