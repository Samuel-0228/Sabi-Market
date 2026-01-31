
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
    // Fixed: Await the async call to get the actual user profile
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
    { name: 'Mon', sales: 400 },
    { name: 'Tue', sales: 300 },
    { name: 'Wed', sales: 200 },
    { name: 'Thu', sales: 600 },
    { name: 'Fri', sales: 800 },
    { name: 'Sat', sales: 1200 },
    { name: 'Sun', sales: 1000 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">{t('dashboard')}</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Total Sales', val: `${stats.totalSales} ETB`, color: 'text-green-600', icon: '💰' },
          { label: 'Active Listings', val: stats.activeListings, color: 'text-blue-600', icon: '📦' },
          { label: 'Pending Orders', val: stats.pendingOrders, color: 'text-orange-600', icon: '⏳' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{s.label}</p>
              <h4 className={`text-2xl font-black mt-1 ${s.color}`}>{s.val}</h4>
            </div>
            <div className="text-4xl bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center">{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Analytics Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold mb-6">Sales Analytics</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="sales" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <h3 className="text-xl font-bold mb-6">Recent Orders</h3>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-gray-400 text-center py-10 italic">No orders yet.</p>
            ) : (
              orders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div>
                    <p className="font-bold text-gray-800">Order #{order.id.slice(0, 5)}</p>
                    <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">{order.amount} ETB</p>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* My Listings */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Manage My Listings</h3>
          <button className="text-sm font-bold text-indigo-600 hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-50">
                <th className="pb-4">Product</th>
                <th className="pb-4">Category</th>
                <th className="pb-4">Price</th>
                <th className="pb-4">Stock</th>
                <th className="pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {listings.map(l => (
                <tr key={l.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 flex items-center gap-3">
                    <img src={l.image_url} className="w-10 h-10 rounded-lg object-cover" />
                    <span className="font-semibold text-gray-800">{l.title}</span>
                  </td>
                  <td className="py-4 text-sm text-gray-600 capitalize">{l.category}</td>
                  <td className="py-4 font-bold text-gray-900">{l.price} ETB</td>
                  <td className="py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${l.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {l.stock} in stock
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="text-gray-400 hover:text-indigo-600 font-bold px-2">Edit</button>
                    <button className="text-gray-400 hover:text-red-500 font-bold px-2">Delete</button>
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
