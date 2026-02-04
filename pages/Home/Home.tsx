
import React, { useEffect, useState } from 'react';
import { productApi } from '../../features/products/product.api';
import { db } from '../../services/supabase/db';
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
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailItem, setDetailItem] = useState<Listing | null>(null);

  useEffect(() => {
    productApi.fetchListings().then(setListings).finally(() => setLoading(false));
  }, []);

  const handleOpenChat = (listing: Listing) => {
    if (!user) return onNavigate('login');
    // INSTANT NAVIGATION: Use localStorage to signal deep-link without waiting for DB
    localStorage.setItem('savvy_pending_chat', JSON.stringify({ 
      listingId: listing.id, 
      sellerId: listing.seller_id 
    }));
    onNavigate('messages');
    setDetailItem(null);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-16 animate-in fade-in duration-700">
      <header className="mb-20">
        <h1 className="text-7xl font-black tracking-tighter dark:text-white mb-4">{t('explore')}</h1>
        <p className="text-xl text-gray-500 italic">Verified trades within Addis Ababa University.</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1,2,3,4].map(i => <div key={i} className="h-96 bg-gray-50 dark:bg-white/5 animate-pulse rounded-[2.5rem]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {listings.map(l => (
            <div key={l.id} className="group cursor-pointer" onClick={() => setDetailItem(l)}>
              <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-gray-50 dark:bg-[#0c0c0e] mb-6 shadow-sm group-hover:shadow-2xl transition-all">
                <img src={l.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <h3 className="text-xl font-black dark:text-white">{l.title}</h3>
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

      <button onClick={onAddListing} className="fixed bottom-10 left-1/2 -translate-x-1/2 btn-hope px-12 py-6 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95">+ {t('startSelling')}</button>
    </div>
  );
};
export default Home;
