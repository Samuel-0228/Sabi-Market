import React from 'react';
import { useAuthStore } from '../../features/auth/auth.store';
import { useLanguage } from '../../app/LanguageContext';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Calendar, Star, Award, TrendingUp } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useLanguage();

  if (!user) return null;

  // Calculate level based on points (e.g., 100 points per level)
  const points = user.points || 0;
  const level = Math.floor(points / 100) + 1;
  const nextLevelPoints = level * 100;
  const progress = (points % 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-gray-100 dark:border-white/10 shadow-sm"
      >
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
    </div>
  );
};

export default ProfilePage;
