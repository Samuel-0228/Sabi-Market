
import React, { useEffect, useState, useRef } from 'react';
import { useFeedStore } from '../../store/feed.store';
import { Listing, UserProfile } from '../../types';
import { useLanguage } from '../../app/LanguageContext';

interface HomeProps {
  user: UserProfile | null;
  onSelectListing: (l: Listing) => void;
  onAddListing: () => void;
  onBuyListing: (l: Listing) => void;
  onNavigate: (p: string) => void;
}

const Home: React.FC<HomeProps> = ({ user, onSelectListing, onAddListing, onBuyListing, onNavigate }) => {
  const { t } = useLanguage();
  const { filteredListings, loading, fetch, setSearchQuery, searchQuery, setCategory, activeCategory } = useFeedStore();
  const [detailItem, setDetailItem] = useState<Listing | null>(null);
  
  // Ref to track the current abort controller
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    fetch(controller.signal);
    
    // STRICT CLEANUP: Abort fetching on navigation
    return () => controller.abort();
  }, [fetch]);

  const handleOpenChat = (listing: Listing) => {
    if (!user) return onNavigate('auth');
    localStorage.setItem('savvy_pending_chat', JSON.stringify({ 
      listingId: listing.id, 
      seller_id: listing.seller_id 
    }));
    onNavigate('messages');
    setDetailItem(null);
  };

  const categories = ['all', 'goods', 'course', 'academic_materials', 'food'];

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-16 animate-in fade-in duration-700">
      <header className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-7xl font-black tracking-tighter dark:text-white mb-4">{t('explore')}</h1>
          <p className="text-xl text-gray-500 italic">Verified trades within Addis Ababa University.</p>
        </div>
        
        <div className="w-full md:w-96 relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
          <input 
            type="text"
            placeholder={t('search')}
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
          {[1,2,3,4].map(i => <div key={i} className="h-96 bg-gray-50 dark:bg-white/5 animate-pulse rounded-[2.5rem]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {filteredListings.map(l => (
            <div key={l.id} className="group cursor-pointer" onClick={() => setDetailItem(l)}>
              <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-gray-50 dark:bg-[#0c0c0e] mb-6 shadow-sm group-hover:shadow-2xl transition-all relative">
                <img src={l.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 dark:bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest dark:text-white">
                    {t(l.category)}
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-black dark:text-white group-hover:text-indigo-600 transition-colors">{l.title}</h3>
              <p className="font-bold text-gray-400">{l.price} ETB</p>
            </div>
          ))}
        </div>
      )}

      {detailItem && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setDetailItem(null)}>
          <div className="bg-white dark:bg-[#0c0c0e] w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="md:w-1/2 bg-black flex items-center justify-center">
              <img src={detailItem.image_url} className="max-h-full object-contain" />
            </div>
            <div className="md:w-1/2 p-10 flex flex-col justify-between overflow-y-auto">
              <div>
                <h2 className="text-3xl font-black dark:text-white mb-4">{detailItem.title}</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">{detailItem.description}</p>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-white/5 rounded-full flex items-center justify-center text-lg">👤</div>
                  <div>
                    <p className="text-sm font-black dark:text-white">{detailItem.seller_name}</p>
                    <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">Verified Seller</p>
                  </div>
                </div>
                <p className="text-4xl font-black text-indigo-600 mb-8">{detailItem.price} ETB</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => handleOpenChat(detailItem)} className="flex-1 bg-gray-100 dark:bg-white/10 dark:text-white py-5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                  {t('chatWithSeller')}
                </button>
                <button onClick={() => { onBuyListing(detailItem); setDetailItem(null); }} className="flex-1 btn-hope py-5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                  {t('buyNow')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button onClick={onAddListing} className="fixed bottom-10 left-1/2 -translate-x-1/2 btn-hope px-12 py-6 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95 z-[50] flex items-center gap-4">
        <span>+</span> {t('startSelling')}
      </button>
    </div>
  );
};

export default Home;
