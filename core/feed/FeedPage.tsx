
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

  // Masonry item logic for staggered effect
  const getSpan = (index: number) => {
    const spans = [18, 24, 20, 28, 22];
    return spans[index % spans.length];
  };

  return (
    <div className="bg-savvy-bg dark:bg-savvy-dark min-h-screen pt-40 px-10 pb-32">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-32 reveal">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-savvy-accent mb-6">AAU Exclusive Marketplace</p>
          <h1 className="text-8xl md:text-[10rem] font-black tracking-tighter uppercase leading-[0.8] mb-12 dark:text-white">
            Curated <br /> <span className="font-serif italic text-savvy-accent lowercase tracking-normal">Commerce.</span>
          </h1>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12">
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-[9px] font-black uppercase tracking-[0.4em] transition-all whitespace-nowrap pb-2 border-b-2 ${
                    activeCategory === cat ? 'border-savvy-indigo text-savvy-indigo' : 'border-transparent text-gray-400'
                  }`}
                >
                  {t(cat)}
                </button>
              ))}
            </div>
            
            <div className="w-full lg:w-[400px] border-b-2 border-black/10 dark:border-white/10 pb-2">
              <input 
                type="text"
                placeholder="Find a campus gem..."
                className="w-full bg-transparent outline-none text-xl font-medium dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {loading && filteredListings.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 animate-pulse">
            {[1,2,3,4,5,6].map(i => <div key={i} className="bg-gray-200 dark:bg-white/5 aspect-[4/5] rounded-[3rem]" />)}
          </div>
        ) : (
          <div className="masonry-grid">
            {filteredListings.map((l, idx) => (
              <div 
                key={l.id} 
                className="reveal group cursor-pointer" 
                style={{ 
                  gridRowEnd: `span ${getSpan(idx)}`,
                  animationDelay: `${idx * 0.1}s` 
                }}
                onClick={() => navigate(`/product/${l.id}`)}
              >
                <div className="relative h-full w-full rounded-[3.5rem] overflow-hidden bg-gray-100 dark:bg-white/5 tibico-border group-hover:shadow-2xl transition-all duration-700">
                  <img src={l.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s] opacity-90 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-10 flex flex-col justify-end">
                    <p className="text-white text-3xl font-black tracking-tighter mb-2">{l.title}</p>
                    <p className="text-savvy-accent font-black text-sm uppercase tracking-widest">{l.price} ETB</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredListings.length === 0 && !loading && (
          <div className="py-60 text-center reveal">
            <p className="font-serif italic text-6xl text-gray-400">Nothing found in this corner of campus.</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => setShowAdd(true)} 
        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 btn-premium px-16 py-8 rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl flex items-center gap-6"
      >
        <span>+</span> SELL A GEM
      </button>

      {showAdd && <AddListingModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); fetch(); }} />}
    </div>
  );
};
export default FeedPage;
