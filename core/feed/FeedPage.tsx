
import React, { useEffect } from 'react';
import { useFeedStore } from '../../store/feed.store';
import { useLanguage } from '../../app/LanguageContext';
import { Listing } from '../../types';

interface FeedPageProps {
  onSelectListing: (l: Listing) => void;
  onBuyListing: (l: Listing) => void;
  onAddListing: () => void;
}

const FeedPage: React.FC<FeedPageProps> = ({ onSelectListing, onBuyListing, onAddListing }) => {
  const { t } = useLanguage();
  const { listings, loading, fetch } = useFeedStore();

  // MANDATORY: Refetch on every mount to clear potential stale or poisoned state
  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-16 animate-in fade-in duration-500">
      <header className="mb-20">
        <h1 className="text-7xl font-black tracking-tighter dark:text-white mb-4">Discover.</h1>
        <p className="text-xl text-gray-500 italic">Safe peer-to-peer trades at AAU.</p>
      </header>

      {loading && listings.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-96 bg-gray-50 dark:bg-white/5 animate-pulse rounded-[2.5rem]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {listings.map(l => (
            <div key={l.id} className="group cursor-pointer" onClick={() => onSelectListing(l)}>
              <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-gray-50 dark:bg-[#0c0c0e] mb-6 shadow-sm group-hover:shadow-2xl transition-all">
                <img src={l.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <h3 className="text-xl font-black dark:text-white">{l.title}</h3>
              <p className="font-bold text-gray-400">{l.price} ETB</p>
            </div>
          ))}
        </div>
      )}

      <button onClick={onAddListing} className="fixed bottom-10 left-1/2 -translate-x-1/2 btn-hope px-12 py-6 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
        + {t('startSelling')}
      </button>
    </div>
  );
};

export default FeedPage;
