
import React, { useEffect, useState } from 'react';
import { db } from '../services/supabaseService';
import { Listing, ListingCategory, UserProfile } from '../types';
import { useLanguage } from './LanguageContext';

interface HomeProps {
  user: UserProfile | null;
  onSelectListing: (listing: Listing) => void;
  onAddListing: () => void;
  onBuyListing?: (listing: Listing) => void;
}

const Home: React.FC<HomeProps> = ({ user, onSelectListing, onAddListing, onBuyListing }) => {
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filter, setFilter] = useState<ListingCategory | 'all' | 'forYou'>(user?.preferences?.length ? 'forYou' : 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailItem, setDetailItem] = useState<Listing | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await db.getListings();
      setListings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'forYou') {
      // Show items matching user preferences
      const userPrefs = user?.preferences || [];
      return matchesSearch && userPrefs.includes(l.category);
    }
    
    return matchesSearch && l.category === filter;
  });

  const handleOpenChat = async (listing: Listing) => {
    try {
      const conversationId = await db.getOrCreateConversation(listing.id, listing.seller_id);
      alert(`🎉 Connection Successful! \n\nYou can now coordinate the exchange with ${listing.seller_name}.`);
    } catch (err: any) {
      alert("⚠️ Error: " + err.message);
    }
  };

  const handleBuyNow = () => {
    if (detailItem && onBuyListing) {
      if (detailItem.stock <= 0) {
        alert("This item is currently sold out.");
        return;
      }
      onBuyListing(detailItem);
      setDetailItem(null);
    }
  };

  const categories: (ListingCategory | 'all' | 'forYou')[] = ['all', 'forYou', 'course', 'academic_materials', 'goods', 'food'];

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-16 reveal relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-24 gap-12">
        <div className="max-w-3xl">
           <h1 className="text-5xl sm:text-[5rem] font-black text-black dark:text-white mb-8 tracking-tighter leading-[0.8]">{t('explore')}</h1>
           <p className="text-gray-500 dark:text-gray-400 font-medium text-xl leading-relaxed max-w-xl">
             {user?.preferences?.length ? `Showing personalized picks for your interests.` : t('discoverText')}
           </p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-white dark:bg-white/5 p-2 rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-white/5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-4 rounded-[1.5rem] whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                filter === cat 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl' 
                : 'text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              {cat === 'forYou' ? (
                <span className="flex items-center gap-2">✨ {t('forYou')}</span>
              ) : t(cat)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-24 relative max-w-4xl">
        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl opacity-40">🔍</div>
        <input 
          type="text" 
          placeholder={t('search')}
          className="w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-[2.5rem] pl-20 pr-10 py-9 text-2xl font-medium shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] focus:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.1)] focus:outline-none transition-all duration-500 dark:text-white dark:focus:bg-white/10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse">
               <div className="bg-gray-100 dark:bg-white/5 aspect-[4/5] rounded-[2.5rem] mb-8"></div>
               <div className="h-6 bg-gray-100 dark:bg-white/5 rounded-[0.75rem] w-2/3 mb-4"></div>
            </div>
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-48 bg-white/60 dark:bg-white/5 glass rounded-[4rem] border border-white dark:border-white/5">
           <div className="text-7xl mb-10 opacity-20">📦</div>
           <h2 className="text-3xl font-black text-black dark:text-white mb-4 tracking-tight">{t('noListings')}</h2>
           <button onClick={() => {setSearchTerm(''); setFilter('all');}} className="text-black dark:text-white font-bold underline">Reset search</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
          {filteredListings.map((listing) => (
            <div 
              key={listing.id}
              onClick={() => setDetailItem(listing)}
              className="group cursor-pointer dribbble-card dark:bg-[#141414] dark:border-white/5 rounded-[2.5rem] p-4"
            >
              <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-white dark:bg-black mb-6">
                <img 
                  src={listing.image_url} 
                  alt={listing.title} 
                  className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                />
                <div className="absolute top-4 left-4">
                   <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg border border-white/10 ${listing.stock === 0 ? 'bg-red-500 text-white' : 'bg-white/90 dark:bg-black/90 backdrop-blur-xl dark:text-white'}`}>
                     {listing.stock === 0 ? t('soldOut') : t(listing.category)}
                   </span>
                </div>
              </div>
              <div className="px-2">
                <div className="flex justify-between items-start mb-2 gap-4">
                  <h3 className="text-xl font-black text-black dark:text-white leading-tight group-hover:text-indigo-500 transition-colors">
                    {listing.title}
                  </h3>
                  <div className="text-right">
                    <p className="text-xl font-black text-black dark:text-white">{listing.price} ETB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[8px] flex items-center justify-center font-bold">✓</div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{listing.seller_name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={onAddListing} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] bg-black dark:bg-white text-white dark:text-black px-10 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-[0_30px_60px_-10px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
        <span className="text-xl">+</span>
        {t('startSelling')}
      </button>

      {detailItem && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-[#141414] w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
             <div className="md:w-1/2 aspect-square md:aspect-auto">
               <img src={detailItem.image_url} className="w-full h-full object-cover" />
             </div>
             <div className="md:w-1/2 p-8 sm:p-12 flex flex-col justify-between overflow-y-auto">
               <div>
                 <div className="flex justify-between items-start mb-8 sm:mb-10">
                   <h2 className="text-4xl sm:text-5xl font-black text-black dark:text-white tracking-tighter leading-none">{detailItem.title}</h2>
                   <button onClick={() => setDetailItem(null)} className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-black dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">✕</button>
                 </div>
                 <p className="text-gray-400 dark:text-gray-400 text-lg font-medium leading-relaxed mb-10">{detailItem.description}</p>
                 
                 <div className="grid grid-cols-2 gap-8 mb-10">
                   <div>
                     <p className="text-[10px] font-black text-gray-300 dark:text-gray-500 uppercase tracking-widest mb-2">{t('price')}</p>
                     <p className="text-3xl font-black text-black dark:text-white">{detailItem.price} ETB</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-gray-300 dark:text-gray-500 uppercase tracking-widest mb-2">{t('availability')}</p>
                     <p className={`text-xl font-bold ${detailItem.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {detailItem.stock > 0 ? `${detailItem.stock} ${t('inStock')}` : t('soldOut')}
                     </p>
                   </div>
                 </div>

                 <div className="bg-gray-50 dark:bg-black/40 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                   <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">{t('sellerContact')}</p>
                   <div className="flex items-center justify-between">
                     <span className="font-bold text-xl text-black dark:text-white">{detailItem.contact_phone || 'Private'}</span>
                     <button className="bg-white dark:bg-white/5 text-black dark:text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-gray-100 dark:border-white/5 shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">Copy</button>
                   </div>
                 </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-4 mt-12">
                 <button onClick={() => handleOpenChat(detailItem)} className="flex-1 bg-gray-50 dark:bg-white/5 text-black dark:text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                   {t('chatWithSeller')}
                 </button>
                 <button onClick={handleBuyNow} disabled={detailItem.stock <= 0} className="flex-1 bg-black dark:bg-white text-white dark:text-black py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                   {detailItem.stock > 0 ? t('buyNow') : t('soldOut')}
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
