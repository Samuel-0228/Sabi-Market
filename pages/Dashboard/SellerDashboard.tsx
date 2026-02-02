
import React, { useState, useEffect } from 'react';
import { db } from '../../services/supabase/db';
import { Listing, Order, UserProfile } from '../../types/index.d';
import { useLanguage } from '../../app/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SellerDashboardProps {
  user: UserProfile;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ user }) => {
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, activeListings: 0, pendingOrders: 0 });
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    loadData();
    const timer = setTimeout(() => setChartReady(true), 500);
    return () => clearTimeout(timer);
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
      console.error("Dashboard load failed", err);
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
    <div className="max-w-[1400px] mx-auto px-8 py-20">
      <header className="mb-16">
        <h1 className="text-6xl font-black text-black dark:text-white tracking-tighter mb-4">{t('commandCenter')}</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Your campus sales activity at a glance.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {[
          { label: t('revenue'), val: stats.totalSales, unit: 'ETB', color: 'text-indigo-600' },
          { label: t('activeItems'), val: stats.activeListings, unit: t('items'), color: 'text-black dark:text-white' },
          { label: t('unresolved'), val: stats.pendingOrders, unit: t('orders'), color: 'text-pink-600' },
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3 bg-white dark:bg-[#0c0c0e] p-10 rounded-[3rem] border border-gray-100 dark:border-white/5">
          <h3 className="text-xl font-black mb-10 tracking-tight dark:text-white">{t('performance')}</h3>
          <div className="w-full h-[350px]">
            {chartReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} />
                  <YAxis hide />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="sales" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center animate-pulse">Loading...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
