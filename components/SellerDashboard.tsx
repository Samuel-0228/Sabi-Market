
import React, { useState, useEffect } from 'react';
import { db } from '../services/supabaseService';
import { Listing, Order } from '../types';
import { useLanguage } from './LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SellerDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, activeListings: 0, pendingOrders: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await db.getCurrentUser();
    if (!user) return;
    
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
  };

  const salesData = [
    { name: 'M', sales: 400 },
    { name: 'T', sales: 300 },
    { name: 'W', sales: 200 },
    { name: 'T', sales: 600 },
    { name: 'F', sales: 800 },
    { name: 'S', sales: 1200 },
    { name: 'S', sales: 1000 },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-20 reveal">
      <header className="mb-20">
        <h1 className="text-6xl font-black text-black tracking-tighter mb-4">Command Center.</h1>
        <p className="text-gray-500 font-medium text-lg">Manage your storefront, track sales, and engage with buyers.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
        {[
          { label: 'Revenue', val: `${stats.totalSales}`, unit: 'ETB', color: 'text-indigo-600' },
          { label: 'Active Items', val: stats.activeListings, unit: 'Items', color: 'text-black' },
          { label: 'Unresolved', val: stats.pendingOrders, unit: 'Orders', color: 'text-gray-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-50">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{s.label}</p>
            <div className="flex items-baseline gap-2">
              <h4 className={`text-5xl font-black tracking-tighter ${s.color}`}>{s.val}</h4>
              <span className="text-xs font-bold text-gray-300 uppercase">{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mb-20">
        {/* Analytics Chart */}
        <div className="lg:col-span-3 bg-white p-10 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-50">
          <h3 className="text-xl font-black mb-10 tracking-tight">Performance</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} dy={15} />
                <YAxis hide />
                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="sales" fill="#000" radius={[12, 12, 12, 12]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-50 overflow-hidden">
          <h3 className="text-xl font-black mb-10 tracking-tight">Activity Log</h3>
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-20 opacity-20">
                <p className="text-5xl mb-4">🌀</p>
                <p className="font-bold text-xs uppercase tracking-widest">No recent logs</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-bold text-black text-sm">Order ID • {order.id.slice(0, 8)}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-black">{order.amount} ETB</p>
                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Completed</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* My Listings */}
      <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-50">
        <div className="flex justify-between items-center mb-12">
          <h3 className="text-xl font-black tracking-tight">Active Inventory</h3>
          <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-black transition-colors">Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-300 text-[9px] font-black uppercase tracking-[0.2em] border-b border-gray-50">
                <th className="pb-6">Description</th>
                <th className="pb-6">Group</th>
                <th className="pb-6">Price</th>
                <th className="pb-6">Quantity</th>
                <th className="pb-6 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {listings.map(l => (
                <tr key={l.id} className="group hover:bg-gray-50 transition-all duration-300">
                  <td className="py-8 flex items-center gap-6">
                    <img src={l.image_url} className="w-16 h-20 rounded-[1.25rem] object-cover shadow-sm" />
                    <span className="font-bold text-black text-lg tracking-tight">{l.title}</span>
                  </td>
                  <td className="py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">{l.category}</td>
                  <td className="py-8 font-black text-black">{l.price} ETB</td>
                  <td className="py-8">
                    <span className="text-[10px] font-black px-4 py-1.5 rounded-full bg-gray-100 text-black uppercase tracking-widest">
                      In Stock
                    </span>
                  </td>
                  <td className="py-8 text-right">
                    <button className="text-[10px] font-black text-gray-300 hover:text-black uppercase tracking-widest mr-6 transition-colors">Modify</button>
                    <button className="text-[10px] font-black text-gray-300 hover:text-red-500 uppercase tracking-widest transition-colors">Archive</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
