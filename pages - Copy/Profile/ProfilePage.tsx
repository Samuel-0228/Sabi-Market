import React from 'react';
import { useAuthStore } from '../../features/auth/auth.store';
import { useLanguage } from '../../app/LanguageContext';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Calendar, Star, Award, TrendingUp, Info, CheckCircle2, ShoppingCart, PlusCircle, Gift, Copy, Check, Clock, Trophy } from 'lucide-react';
import Leaderboard from '../../components/Leaderboard';
import { db } from '../../services/supabase/db';
import XpAnimation from '../../components/XpAnimation';

const ProfilePage: React.FC = () => {
  const { user, sync } = useAuthStore();
  const { t } = useLanguage();
  const [copied, setCopied] = React.useState(false);
  const [claiming, setClaiming] = React.useState(false);
  const [xpGained, setXpGained] = React.useState<number | null>(null);
  const [achievements, setAchievements] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (user) {
      db.getUserAchievements(user.id).then(setAchievements);
    }
  }, [user]);

  if (!user) return null;

  // Calculate level based on points (e.g., 100 points per level)
  const points = user.points || 0;
  const level = user.level || Math.floor(points / 100) + 1;
  const nextLevelPoints = level * 100;
  const progress = (points % 100);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const result = await db.dailyClaim(user.id);
      if (result.success) {
        setXpGained(result.reward);
        await sync();
        setTimeout(() => setXpGained(null), 3000);
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Claim failed", err);
    } finally {
      setClaiming(false);
    }
  };

  const copyReferral = () => {
    if (user.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
    <div className="max-w-6xl mx-auto px-4 py-12">
      {xpGained && <XpAnimation amount={xpGained} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile & Stats */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-gray-100 dark:border-white/10 shadow-sm"
          >
            <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
              <div className="w-32 h-32 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-xl relative">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={64} className="text-indigo-600 dark:text-indigo-400" />
                )}
                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black border-4 border-white dark:border-zinc-900 shadow-lg">
                  {level}
                </div>
              </div>
              <div className="text-center md:text-left flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                  <h1 className="text-4xl font-black tracking-tighter dark:text-white">{user.full_name}</h1>
                  <button 
                    onClick={handleClaim}
                    disabled={claiming}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2 self-center md:self-auto"
                  >
                    {claiming ? <Clock size={12} className="animate-spin" /> : <Gift size={12} />}
                    {claiming ? 'Claiming...' : 'Daily Claim'}
                  </button>
                </div>
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
                  <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    🔥 {user.login_streak || 0} Day Streak
                  </span>
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

            {/* Referral Section */}
            <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 mb-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="font-bold dark:text-white flex items-center gap-2">
                    <Gift className="text-indigo-600" size={18} />
                    Invite Friends, Earn Points
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Get 50 points for every friend who joins using your code.</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-black/5 dark:border-white/5 w-full md:w-auto">
                  <code className="px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{user.referral_code || 'SAVVY-USER'}</code>
                  <button 
                    onClick={copyReferral}
                    className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    {copied ? <Check className="text-emerald-500" size={16} /> : <Copy size={16} className="text-gray-400" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100 dark:border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Achievement Badges</h3>
              <div className="flex flex-wrap gap-4">
                {achievements.length > 0 ? achievements.map((ua) => (
                  <div key={ua.id} className="group relative">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-2xl shadow-sm hover:scale-110 transition-transform cursor-help">
                      {ua.achievement?.icon || '🏆'}
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-black text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-2xl">
                      <p className="font-black uppercase tracking-widest mb-1">{ua.achievement?.title}</p>
                      <p className="opacity-70 leading-relaxed">{ua.achievement?.description}</p>
                      <div className="mt-2 text-amber-400 font-bold">+{ua.achievement?.xp_reward} Points</div>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-gray-500 italic">No badges earned yet. Start trading to unlock achievements!</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Earning Guide Section */}
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
          </motion.div>
        </div>

        {/* Right Column: Leaderboard */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-gray-100 dark:border-white/10 shadow-sm sticky top-24"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
                <Trophy size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter dark:text-white">Leaderboard</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Top Savvy Traders</p>
              </div>
            </div>
            
            <Leaderboard />
            
            <div className="mt-8 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Position</p>
              <p className="text-xl font-black dark:text-white mt-1">Top 5%</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
