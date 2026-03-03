
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Plus, Filter } from 'lucide-react';
import { useFeedStore } from '../../store/feed.store';
import { useAuthStore } from '../../features/auth/auth.store';
import { useUIStore } from '../../store/ui.store';
import { useLanguage } from '../../app/LanguageContext';
import { Listing } from '../../types';
import { db } from '../../services/supabase/db';
import AddListingModal from '../../components/product/AddListingModal';

const FeedPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { filteredListings, loading, fetch, setSearchQuery, searchQuery, setCategory, activeCategory, smartSearch, sortBy, setSortBy } = useFeedStore();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [showAdd, setShowAdd] = useState(false);
  const [isSmartSearch, setIsSmartSearch] = useState(false);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleAddToCart = async (e: React.MouseEvent, listing: Listing) => {
    e.stopPropagation();
    if (!user) return navigate('/auth');
    try {
      await db.addToCart(user.id, listing.id);
      addToast(`${listing.title} added to cart!`, 'success');
    } catch (err) {
      addToast('Failed to add to cart', 'error');
    }
  };

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
    <div className="bg-savvy-bg dark:bg-savvy-dark min-h-screen pt-24 md:pt-40 px-4 md:px-10 pb-32">
      <div className="max-w-[1200px] mx-auto">
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 md:mb-20"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-savvy-accent mb-3">AAU Market</p>
              <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] dark:text-white">
                Daily <br /> <span className="font-serif italic text-savvy-accent lowercase tracking-normal">Feed.</span>
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 md:gap-8">
              <div className="flex flex-col gap-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Sort By</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  title="Sort listings"
                  className="bg-transparent border-b border-black/10 dark:border-white/10 text-[10px] font-black uppercase tracking-widest outline-none dark:text-white pb-1 cursor-pointer"
                >
                  <option value="newest" className="dark:bg-black">Newest</option>
                  <option value="price_asc" className="dark:bg-black">Price: Low to High</option>
                  <option value="price_desc" className="dark:bg-black">Price: High to Low</option>
                </select>
              </div>
              <button 
                onClick={() => navigate('/cart')}
                className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                Cart
              </button>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-t border-black/5 dark:border-white/5 pt-8">
            <div className="flex gap-6 overflow-x-auto w-full pb-2 scrollbar-hide no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap pb-2 border-b-2 ${
                    activeCategory === cat ? 'border-savvy-indigo text-savvy-indigo' : 'border-transparent text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {t(cat)}
                </button>
              ))}
            </div>
            
            <form onSubmit={handleSearch} className="w-full lg:w-[400px] relative group">
              <div className="flex items-center border-b-2 border-black/10 dark:border-white/10 pb-2 gap-4">
                <Search className="w-5 h-5 text-gray-400" />
                <input 
                  type="text"
                  placeholder={isSmartSearch ? "Ask Savvy AI (e.g. 'dorm decor')..." : "Search..."}
                  className="flex-1 bg-transparent outline-none text-sm font-bold dark:text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setIsSmartSearch(!isSmartSearch)}
                  aria-label={isSmartSearch ? 'Disable smart search' : 'Enable smart search'}
                  className={`p-2 rounded-xl transition-all ${isSmartSearch ? 'bg-savvy-indigo text-white shadow-lg' : 'text-gray-400 hover:bg-black/5'}`}
                  title="Toggle Smart Search"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
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
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8"
            >
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="bg-gray-100 dark:bg-white/5 aspect-[4/5] rounded-[2rem] animate-pulse" />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8"
            >
              {filteredListings.map((l, idx) => (
                <motion.div 
                  key={l.id} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (idx % 12) * 0.05 }}
                  className="group cursor-pointer bg-white dark:bg-[#0c0c0e] rounded-[2rem] overflow-hidden tibico-border shadow-sm flex flex-col hover:shadow-2xl transition-all duration-500" 
                  onClick={() => navigate(`/product/${l.id}`)}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-50 dark:bg-white/5">
                    <img src={l.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" alt={l.title} />
                    <div className="absolute top-4 left-4">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">{t(l.category)}</span>
                    </div>
                    <button 
                      onClick={(e) => handleAddToCart(e, l)}
                      aria-label={`Add ${l.title} to cart`}
                      title={`Add ${l.title} to cart`}
                      className="absolute bottom-4 right-4 w-12 h-12 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:bg-savvy-indigo hover:text-white"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-sm md:text-base font-black dark:text-white line-clamp-2 leading-tight mb-3 min-h-[2.8em] tracking-tight">
                      {l.title}
                    </h3>
                    <div className="mt-auto flex items-baseline justify-between border-t dark:border-white/5 pt-4">
                      <p className="text-lg md:text-2xl font-black text-black dark:text-white tracking-tighter">
                        {l.price} <span className="text-[10px] font-bold text-gray-400">ETB</span>
                      </p>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">AAU Verified</span>
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
