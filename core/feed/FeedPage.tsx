
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedStore } from '../../store/feed.store';
import { useLanguage } from '../../app/LanguageContext';
import { Listing } from '../../types';
import AddListingModal from '../../components/product/AddListingModal';

const FeedPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { filteredListings, loading, fetch, setSearchQuery, searchQuery, setCategory, activeCategory } = useFeedStore();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const categories = ['all', 'goods', 'course', 'academic_materials', 'food'];

  return (
    <div className="bg-savvy-bg dark:bg-savvy-dark min-h-screen pt-24 md:pt-40 px-3 md:px-10 pb-32">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-8 md:mb-20 reveal">
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
            
            <div className="w-full lg:w-[320px] border-b border-black/10 dark:border-white/10 pb-1">
              <input 
                type="text"
                placeholder="Search..."
                className="w-full bg-transparent outline-none text-sm font-medium dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {loading && filteredListings.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 animate-pulse">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-gray-100 dark:bg-white/5 aspect-square rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-6">
            {filteredListings.map((l, idx) => (
              <div 
                key={l.id} 
                className="reveal group cursor-pointer bg-white dark:bg-[#0c0c0e] rounded-2xl overflow-hidden tibico-border shadow-sm flex flex-col" 
                style={{ animationDelay: `${(idx % 10) * 0.05}s` }}
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
              </div>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={() => setShowAdd(true)} 
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 btn-premium px-8 py-4 rounded-full font-black text-[9px] uppercase tracking-[0.3em] shadow-2xl flex items-center gap-3 border border-white/10"
      >
        <span>+</span> SELL
      </button>

      {showAdd && <AddListingModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); fetch(); }} />}
    </div>
  );
};
export default FeedPage;
