import React, { useEffect, useState } from 'react';
import { db } from '../services/supabase/db';
import { motion } from 'framer-motion';
import { Trophy, Medal, User, Star, Award } from 'lucide-react';

const Leaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const data = await db.getLeaderboard(10);
        setLeaders(data);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, []);

  if (loading) return <div className="animate-pulse space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-16 bg-gray-100 dark:bg-white/5 rounded-2xl" />
    ))}
  </div>;

  return (
    <div className="space-y-3">
      {leaders.map((leader, index) => (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          key={leader.id}
          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
            index === 0 ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30' : 
            index === 1 ? 'bg-slate-50/50 border-slate-200 dark:bg-slate-500/10 dark:border-slate-500/30' :
            index === 2 ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30' :
            'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10'
          }`}
        >
          <div className="w-8 flex justify-center font-black text-lg italic">
            {index === 0 ? <Trophy className="text-amber-500" size={24} /> : 
             index === 1 ? <Medal className="text-slate-400" size={24} /> :
             index === 2 ? <Medal className="text-orange-400" size={24} /> :
             <span className="text-gray-400">#{index + 1}</span>}
          </div>

          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-black/5 dark:border-white/5">
            {leader.avatar_url ? (
              <img src={leader.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={20} className="text-gray-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm truncate dark:text-white">{leader.full_name}</h4>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Lvl {leader.level || 1}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 justify-end text-amber-500">
              <Star size={12} fill="currentColor" />
              <span className="font-black text-sm">{leader.points || 0}</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Points</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Leaderboard;
