
import React, { useEffect, useState } from 'react';
import { useFeedStore } from '../../store/feed.store';
import { useLanguage } from '../../app/LanguageContext';
import { Listing } from '../../types';
import AddListingModal from '../../components/product/AddListingModal';

const FeedPage: React.FC = () => {
  const { t } = useLanguage();
  const { filteredListings, loading, fetch, setSearchQuery, searchQuery, setCategory, activeCategory } = useFeedStore();
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const categories = ['all', 'goods', 'course', 'academic_materials', 'food'];

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-10 animate-in fade-in duration-700">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-6xl font-black tracking-tighter dark:text-white mb-2">Explore.</h1>
          <p className="text-gray-500 font-medium italic">Verified trades within Addis Ababa University.</p>
        </div>
        
        <div className="w-full md:w-96 relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
          <input 
            type="text"
            placeholder="Search items, books..."
            className="w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="flex gap-3 mb-12 overflow-x-auto pb-4 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              activeCategory === cat 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg' 
                : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-indigo-500'
            }`}
          >
            {t(cat)}
          </button>
        ))}
      </div>

      {loading && filteredListings.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1,2,3,4].map(i => <div key={i} className="h-80 bg-gray-50 dark:bg-white/5 animate-pulse rounded-[2.5rem]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {filteredListings.map(l => (
            <div key={l.id} className="group cursor-pointer" onClick={() => setSelectedListing(l)}>
              <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-gray-50 dark:bg-[#0c0c0e] mb-5 shadow-sm group-hover:shadow-2xl transition-all relative">
                <img src={l.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 dark:bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest dark:text-white border border-white/10">
                    {t(l.category)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-start px-2">
                <div>
                  <h3 className="text-lg font-black dark:text-white leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{l.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400">{l.seller_name}</span>
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" title="Verified AAU Student"></span>
                  </div>
                </div>
                <p className="font-black text-indigo-600 text-lg">{l.price} ETB</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddListingModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); fetch(); }} />}

      <button 
        onClick={() => setShowAdd(true)} 
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 btn-hope px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-4"
      >
        <span>+</span> {t('startSelling')}
      </button>
    </div>
  );
};
export default FeedPage;
