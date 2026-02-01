
import React, { useState, useEffect } from 'react';
import { db } from '../services/supabaseService';
import { Listing, Order, UserProfile } from '../types';
import { useLanguage } from './LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SellerDashboardProps {
  user: UserProfile;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ user }) => {
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, activeListings: 0, pendingOrders: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadData().then(() => setIsLoaded(true));
  }, [user]);

  const loadData = async () => {
    try {
      const allListings = await db.getListings();
      const myListings = allListings.filter(l => l.seller_id === user.id);
      const myOrders = await db.getOrders('seller');

      setListings(myListings);
      setOrders(myOrders);

      const totalSales = myOrders.reduce((acc, o) => acc + (o.status === 'completed' ? o.amount : 0), 0);
      setStats({
        totalSales,
        activeListings: myListings.length,
        pendingOrders: myOrders.filter(o => o.status === 'pending').length
      });
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    }
  };

  const salesData = [
    { name: 'Mon', sales: 400 },
    { name: 'Tue', sales: 300 },
    { name: 'Wed', sales: 200 },
    { name: 'Thu', sales: 600 },
    { name: 'Fri', sales: 800 },
    { name: 'Sat', sales: 1200 },
    { name: 'Sun', sales: 1000 },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-20 animate-in fade-in duration-700">
      <header className="mb-20">
        <h1 className="text-6xl font-black text-black dark:text-white tracking-tighter mb-4">{t('commandCenter')}</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Manage your storefront and track AAU campus sales.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
        {[
          { label: t('revenue'), val: `${stats.totalSales}`, unit: 'ETB', color: 'text-savvy-primary' },
          { label: t('activeItems'), val: stats.activeListings, unit: t('items'), color: 'text-black dark:text-white' },
          { label: t('unresolved'), val: stats.pendingOrders, unit: t('orders'), color: 'text-savvy-pink' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#0c0c0e] p-12 rounded-[3rem] shadow-sm border border-gray-100 dark:border-white/5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">{s.label}</p>
            <div className="flex items-baseline gap-2">
              <h4 className={`text-5xl font-black tracking-tighter ${s.color}`}>{s.val}</h4>
              <span className="text-xs font-bold text-gray-400 uppercase">{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mb-20">
        <div className="lg:col-span-3 bg-white dark:bg-[#0c0c0e] p-12 rounded-[3.5rem] border border-gray-100 dark:border-white/5 min-w-0">
          <h3 className="text-xl font-black mb-10 tracking-tight dark:text-white">{t('performance')}</h3>
          {/* CRITICAL FIX: Explicit dimensions for Recharts container */}
          <div className="w-full h-[400px] relative overflow-hidden" style={{ minWidth: 0 }}>
            {isLoaded && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} dy={15} />
                  <YAxis hide />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="sales" fill="#6366f1" radius={[10, 10, 10, 10]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-[#0c0c0e] p-12 rounded-[3.5rem] border border-gray-100 dark:border-white/5">
          <h3 className="text-xl font-black mb-10 tracking-tight dark:text-white">{t('activityLog')}</h3>
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-20 opacity-20">
                <p className="text-5xl mb-4">📦</p>
                <p className="font-bold text-xs uppercase tracking-widest dark:text-white">No sales yet</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="flex items-center justify-between py-6 border-b border-gray-50 dark:border-white/5 last:border-0">
                  <div>
                    <p className="font-bold text-black dark:text-white text-sm">{order.listing_title}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-black dark:text-white">{order.amount} ETB</p>
                    <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">{order.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
