import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Award, TrendingUp } from 'lucide-react';

interface XpAnimationProps {
  amount: number;
  type?: 'xp' | 'level' | 'achievement';
}

const XpAnimation: React.FC<XpAnimationProps> = ({ amount, type = 'xp' }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.5 }}
          animate={{ opacity: 1, y: -50, scale: 1.2 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-24 right-8 z-[200] flex items-center gap-3 bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/20"
        >
          <div className="p-2 bg-white/20 rounded-xl">
            {type === 'xp' ? <Star size={20} fill="currentColor" /> : 
             type === 'level' ? <TrendingUp size={20} /> : 
             <Award size={20} />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
              {type === 'xp' ? 'XP Gained' : type === 'level' ? 'Level Up!' : 'Achievement!'}
            </p>
            <h4 className="text-xl font-black tracking-tighter">
              {type === 'xp' ? `+${amount} XP` : type === 'level' ? `Level ${amount}` : amount}
            </h4>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default XpAnimation;
