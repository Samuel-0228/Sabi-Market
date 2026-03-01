import React from 'react';
import { useAuthStore } from '../../features/auth/auth.store';
import { useLanguage } from '../../app/LanguageContext';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Calendar, Star, Award, TrendingUp, Info, CheckCircle2, ShoppingCart, PlusCircle } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useLanguage();

  if (!user) return null;

  // Calculate level based on points (e.g., 100 points per level)
  const points = user.points || 0;
  const level = Math.floor(points / 100) + 1;
  const nextLevelPoints = level * 100;
  const progress = (points % 100);

  const earningOptions = [
    {
      icon: <TrendingUp className="text-emerald-500" size={20} />,
      title: "Daily Visit",
      points: "+10 Points",
      description: "Simply open Savvy Market to keep your streak alive."
    },
    {
      icon: <PlusCircle className="text-indigo-500" size={20} />,
      title: "List an Item",
      points: "+50 Points",
      description: "Add a new product to the marketplace for others to buy."
    },
    {
      icon: <ShoppingCart className="text-amber-500" size={20} />,
      title: "Complete a Trade",
      points: "+100 Points",
      description: "Successfully buy or sell an item on the platform."
    },
    {
      icon: <CheckCircle2 className="text-blue-500" size={20} />,
      title: "Verify Account",
      points: "+200 Points",
      description: "Confirm your AAU student status for a massive boost."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-gray-100 dark:border-white/10 shadow-sm mb-8"
      >
        {/* ... existing profile header ... */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
          <div className="w-32 h-32 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-xl">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={64} className="text-indigo-600 dark:text-indigo-400" />
            )}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black tracking-tighter dark:text-white mb-2">{user.full_name}</h1>
            <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center md:justify-start gap-2">
              <Mail size={16} /> {user.email}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Shield size={12} /> {user.role}
              </span>
              {user.is_verified && (
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  Verified Student
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ... existing stats grid ... */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
              <Star size={20} />
              <span className="font-bold uppercase text-xs tracking-widest">Total Points</span>
            </div>
            <div className="text-3xl font-black dark:text-white">{points}</div>
            <p className="text-xs text-gray-500 mt-1">Earned through activity</p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <Award size={20} />
              <span className="font-bold uppercase text-xs tracking-widest">Current Level</span>
            </div>
            <div className="text-3xl font-black dark:text-white">Lvl {level}</div>
            <p className="text-xs text-gray-500 mt-1">Savvy Trader Status</p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4 text-emerald-500">
              <TrendingUp size={20} />
              <span className="font-bold uppercase text-xs tracking-widest">Visits</span>
            </div>
            <div className="text-3xl font-black dark:text-white">{user.visit_count || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Total platform visits</p>
          </div>
        </div>

        {/* ... existing progress bar ... */}
        <div className="mb-12">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-bold dark:text-white">Level Progress</h3>
              <p className="text-xs text-gray-500">{nextLevelPoints - points} points until Level {level + 1}</p>
            </div>
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{progress}%</div>
          </div>
          <div className="h-3 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-indigo-600 dark:bg-indigo-500"
            />
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 dark:border-white/10">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Account Details</h3>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-50 dark:border-white/5">
              <span className="text-gray-500 flex items-center gap-2"><Calendar size={14} /> Joined</span>
              <span className="font-medium dark:text-white">{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50 dark:border-white/5">
              <span className="text-gray-500 flex items-center gap-2"><Shield size={14} /> Account Type</span>
              <span className="font-medium dark:text-white capitalize">{user.role}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* New Earning Guide Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-gray-100 dark:border-white/10 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Info size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter dark:text-white">How to Level Up</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Earning Points Guide</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {earningOptions.map((option, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex gap-4 items-start hover:border-indigo-500/30 transition-colors group">
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                {option.icon}
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold dark:text-white text-sm">{option.title}</h4>
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    {option.points}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{option.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 rounded-2xl bg-indigo-600 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-black tracking-tight mb-1">Ready to climb the ranks?</h3>
            <p className="text-indigo-100 text-xs">Higher levels unlock exclusive badges and lower commission rates.</p>
          </div>
          <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg">
            Start Trading Now
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
