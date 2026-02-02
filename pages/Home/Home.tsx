
import React, { useEffect, useState } from 'react';
import { db } from '../../services/supabase/db';
import { Listing, ListingCategory, UserProfile } from '../../types/index.d';
import { useLanguage } from '../../app/LanguageContext';

interface HomeProps {
  user: UserProfile | null;
  onSelectListing: (listing: Listing) => void;
  onAddListing: () => void;
  onBuyListing?: (listing: Listing) => void;
  onNavigate: (page: string) => void;
}

const Home: React.FC<HomeProps> = ({ user, onSelectListing, onAddListing, onBuyListing, onNavigate }) => {
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
      const userPrefs = user?.preferences || [];
      return matchesSearch && userPrefs.includes(l.category);
    }
    return matchesSearch && l.category === filter;
  });

  const handleOpenChat = async (listing: Listing) => {
    if (!user) {
      onNavigate('auth');
      return;
    }
    try {
      setLoading(true);
      await db.getOrCreateConversation(listing.id, listing.seller_id);
      onNavigate('messages');
    } catch (err: any) {
      alert("⚠️ " + err.message);
    } finally {
      setLoading(false);
      setDetailItem(null);
    }
  };

  const categories: (ListingCategory | 'all' | 'forYou')[] = ['all', 'forYou', 'course', 'academic_materials', 'goods', 'food'];

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-16 reveal relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-24 gap-12">
        <div className="max-w-3xl">
           <h1 className="text-5xl sm:text-[5.5rem] font-black text-black dark:text-white mb-8 tracking-tighter leading-[0.8]">{t('explore')}</h1>
           <p className="text-gray-500 dark:text-gray-400 font-medium text-xl leading-relaxed max-w-xl italic">
             Connecting AAU campus life through commerce.
           </p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-white dark:bg-white/5 p-2 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-4 rounded-[1.5rem] whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === cat 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl scale-95' 
                : 'text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              {cat === 'forYou' ? `✨ ${t('forYou')}` : t(cat)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-24 relative max-w-4xl">
        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl opacity-40">🔍</div>
        <input 
          type="text" 
          placeholder={t('search')}
          className="w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] pl-20 pr-10 py-9 text-2xl font-medium shadow-sm focus:shadow-xl transition-all outline-none dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse bg-gray-50 dark:bg-white/5 aspect-[4/5] rounded-[2.5rem]"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
          {filteredListings.map((listing) => (
            <div key={listing.id} onClick={() => setDetailItem(listing)} className="group cursor-pointer">
              <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-gray-50 dark:bg-black mb-6 shadow-sm group-hover:shadow-2xl transition-all">
                <img src={listing.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                <div className="absolute top-4 left-4">
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-xl dark:text-white shadow-lg">
                     {t(listing.category)}
                   </span>
                </div>
              </div>
              <h3 className="text-xl font-black dark:text-white group-hover:text-savvy-primary transition-colors">{listing.title}</h3>
              <p className="text-lg font-black text-gray-400 mt-2">{listing.price} ETB</p>
            </div>
          ))}
        </div>
      )}

      <button onClick={onAddListing} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] btn-hope px-12 py-6 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl flex items-center gap-4">
        <span>+</span> {t('startSelling')}
      </button>

      {detailItem && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0c0c0e] w-full max-w-5xl rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
             <div className="md:w-1/2 overflow-hidden bg-black flex items-center justify-center">
               <img src={detailItem.image_url} className="w-full h-full object-contain" />
             </div>
             <div className="md:w-1/2 p-12 flex flex-col justify-between overflow-y-auto">
               <div>
                 <div className="flex justify-between items-start mb-10">
                   <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter">{detailItem.title}</h2>
                   <button onClick={() => setDetailItem(null)} className="w-12 h-12 bg-gray-50 dark:bg-white/10 rounded-full flex items-center justify-center dark:text-white">✕</button>
                 </div>
                 <p className="text-gray-500 text-lg leading-relaxed mb-10">{detailItem.description}</p>
                 <div className="grid grid-cols-2 gap-8 mb-10">
                   <div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('price')}</p>
                     <p className="text-3xl font-black dark:text-white">{detailItem.price} ETB</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Seller</p>
                     <p className="text-xl font-bold dark:text-white">{detailItem.seller_name}</p>
                   </div>
                 </div>
               </div>
               <div className="flex gap-4">
                 <button onClick={() => handleOpenChat(detailItem)} className="flex-1 bg-gray-100 dark:bg-white/10 dark:text-white py-6 rounded-full font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all">
                   {t('chatWithSeller')}
                 </button>
                 <button onClick={() => { if(onBuyListing) onBuyListing(detailItem); setDetailItem(null); }} className="flex-1 btn-hope py-6 rounded-full font-black text-sm uppercase tracking-widest shadow-xl">
                   {t('buyNow')}
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
