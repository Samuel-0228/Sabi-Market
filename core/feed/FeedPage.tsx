
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Plus, Filter } from 'lucide-react';
import { useFeedStore } from '../../store/feed.store';
import { useLanguage } from '../../app/LanguageContext';
import { Listing } from '../../types';
import AddListingModal from '../../components/product/AddListingModal';

const FeedPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { filteredListings, loading, fetch, setSearchQuery, searchQuery, setCategory, activeCategory, smartSearch } = useFeedStore();
  const [showAdd, setShowAdd] = useState(false);
  const [isSmartSearch, setIsSmartSearch] = useState(false);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSmartSearch) {
      smartSearch(searchQuery);
    } else {
      setSearchQuery(searchQuery);
    }
  };

  const categories = ['all', 'goods', 'course', 'academic_materials', 'food'];

  return (
    <div className="bg-savvy-bg dark:bg-savvy-dark min-h-screen pt-24 md:pt-40 px-3 md:px-10 pb-32">
      <div className="max-w-[1600px] mx-auto">
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-20"
        >
          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-savvy-accent mb-2">AAU Market</p>
          <h1 className="text-3xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-6 dark:text-white">
            Daily <br /> <span className="font-serif italic text-savvy-accent lowercase tracking-normal">Feed.</span>
          </h1>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
            <div className="flex gap-4 overflow-x-auto w-full pb-1 scrollbar-hide no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap pb-1 border-b ${
                    activeCategory === cat ? 'border-savvy-indigo text-savvy-indigo' : 'border-transparent text-gray-400'
                  }`}
                >
                  {t(cat)}
                </button>
              ))}
            </div>
            
            <form onSubmit={handleSearch} className="w-full lg:w-[400px] relative group">
              <div className="flex items-center border-b border-black/10 dark:border-white/10 pb-1 gap-3">
                <Search className="w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder={isSmartSearch ? "Ask Savvy AI (e.g. 'dorm decor')..." : "Search..."}
                  className="flex-1 bg-transparent outline-none text-sm font-medium dark:text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setIsSmartSearch(!isSmartSearch)}
                  className={`p-1.5 rounded-lg transition-all ${isSmartSearch ? 'bg-savvy-indigo text-white shadow-lg' : 'text-gray-400 hover:bg-black/5'}`}
                  title="Toggle Smart Search"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
              {isSmartSearch && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 mt-2 text-[8px] font-bold text-savvy-indigo uppercase tracking-widest"
                >
                  Smart Search Active – Powered by Gemini
                </motion.div>
              )}
            </form>
          </div>
        </motion.header>

        <AnimatePresence mode="popLayout">
          {loading && filteredListings.length === 0 ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2"
            >
              {[1,2,3,4,5,6,7,8,9,10].map(i => (
                <div key={i} className="bg-gray-100 dark:bg-white/5 aspect-square rounded-2xl animate-pulse" />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              layout
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-6"
            >
              {filteredListings.map((l, idx) => (
                <motion.div 
                  key={l.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (idx % 10) * 0.05 }}
                  className="group cursor-pointer bg-white dark:bg-[#0c0c0e] rounded-2xl overflow-hidden tibico-border shadow-sm flex flex-col hover:shadow-xl transition-all duration-500" 
                  onClick={() => navigate(`/product/${l.id}`)}
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-white/5">
                    <img src={l.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1s]" alt={l.title} />
                    <div className="absolute top-2 left-2">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[6px] font-black uppercase tracking-widest px-2 py-1 rounded-full">{t(l.category)}</span>
                    </div>
                  </div>

                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-[10px] md:text-sm font-bold dark:text-white line-clamp-2 leading-tight mb-2 min-h-[2.4em]">
                      {l.title}
                    </h3>
                    <div className="mt-auto flex items-baseline justify-between">
                      <p className="text-[11px] md:text-lg font-black text-black dark:text-white tracking-tighter">
                        {l.price} <span className="text-[7px] font-bold text-gray-400">ETB</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {filteredListings.length === 0 && !loading && (
          <div className="py-40 text-center">
            <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-[10px]">No gems found in this sector</p>
            <button onClick={() => { setSearchQuery(''); setCategory('all'); }} className="mt-4 text-savvy-indigo font-black uppercase tracking-widest text-[8px] border-b border-savvy-indigo pb-1">Reset Filters</button>
          </div>
        )}
      </div>

      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAdd(true)} 
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 btn-premium px-8 py-4 rounded-full font-black text-[9px] uppercase tracking-[0.3em] shadow-2xl flex items-center gap-3 border border-white/10"
      >
        <Plus className="w-4 h-4" /> SELL
      </motion.button>

      {showAdd && <AddListingModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); fetch(); }} />}
    </div>
  );
};
export default FeedPage;
