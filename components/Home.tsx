
import React, { useEffect, useState } from 'react';
import { db } from '../services/supabaseService';
import { Listing, ListingCategory } from '../types';
import { useLanguage } from './LanguageContext';

interface HomeProps {
  onSelectListing: (listing: Listing) => void;
  onAddListing: () => void;
}

const Home: React.FC<HomeProps> = ({ onSelectListing, onAddListing }) => {
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filter, setFilter] = useState<ListingCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    const data = await db.getListings();
    setListings(data);
    setLoading(false);
  };

  const filteredListings = listings.filter(l => {
    const matchesCategory = filter === 'all' || l.category === filter;
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         l.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder={t('search')}
            className="w-full bg-white border border-gray-200 rounded-2xl px-12 py-4 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'goods', 'tutoring', 'digital', 'services'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat as any)}
              className={`px-6 py-4 rounded-2xl whitespace-nowrap font-medium transition-all shadow-sm ${
                filter === cat 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {t(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Section if no items */}
      {filteredListings.length === 0 && !loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('noListings')}</h2>
          <p className="text-gray-500 mb-6">Start your entrepreneurship journey today!</p>
          <button 
            onClick={onAddListing}
            className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-xl hover:bg-indigo-700 transition-all"
          >
            + {t('sell')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredListings.map((listing) => (
            <div 
              key={listing.id}
              onClick={() => onSelectListing(listing)}
              className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all cursor-pointer flex flex-col"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img 
                  src={listing.image_url} 
                  alt={listing.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-indigo-600 shadow-sm uppercase">
                  {t(listing.category)}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {listing.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1">
                  {listing.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-xs text-gray-400 block uppercase font-bold tracking-tighter">{t('price')}</span>
                    <span className="text-xl font-extrabold text-indigo-600">{listing.price} ETB</span>
                  </div>
                  <button className="bg-gray-50 p-3 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all text-indigo-600 shadow-inner">
                    →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Sell FAB */}
      <button 
        onClick={onAddListing}
        className="fixed bottom-24 right-6 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold shadow-2xl hover:scale-105 transition-all flex items-center gap-2 z-50"
      >
        <span className="text-xl">+</span>
        <span>{t('sell')}</span>
      </button>
    </div>
  );
};

export default Home;
