
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
    const matchesCategory = filter === 'all' || l.category === filter;
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-16 reveal">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-24 gap-12">
        <div className="max-w-3xl">
           <h1 className="text-[5rem] font-black text-black mb-8 tracking-tighter leading-[0.8]">Explore.</h1>
           <p className="text-gray-500 font-medium text-xl leading-relaxed max-w-xl">
             The premium student marketplace. Discover hand-picked gear, tutoring, and more from your peers.
           </p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-gray-100">
          {['all', 'goods', 'tutoring', 'digital', 'services'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat as any)}
              className={`px-8 py-4 rounded-[1.5rem] whitespace-nowrap text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${
                filter === cat 
                ? 'bg-black text-white shadow-xl' 
                : 'text-gray-400 hover:text-black hover:bg-gray-50'
              }`}
            >
              {t(cat)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-24 relative max-w-4xl">
        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl opacity-40">🔍</div>
        <input 
          type="text" 
          placeholder="Search for something special..."
          className="w-full bg-white border border-gray-100 rounded-[2.5rem] pl-20 pr-10 py-9 text-2xl font-medium shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] focus:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.1)] focus:outline-none transition-all duration-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="animate-pulse">
               <div className="bg-gray-100 aspect-[4/5] rounded-[2.5rem] mb-8"></div>
               <div className="h-6 bg-gray-100 rounded-[0.75rem] w-2/3 mb-4"></div>
               <div className="h-4 bg-gray-100 rounded-[0.75rem] w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-48 bg-white/60 glass rounded-[4rem] border border-white">
           <div className="text-7xl mb-10 opacity-20">📦</div>
           <h2 className="text-3xl font-black text-black mb-4 tracking-tight">Empty Market</h2>
           <p className="text-gray-400 font-medium text-lg mb-12">No products found matching your criteria.</p>
           <button 
             onClick={() => {setSearchTerm(''); setFilter('all');}}
             className="bg-black text-white px-12 py-5 rounded-[1.5rem] font-bold btn-primary"
           >
             Clear All Filters
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
          {filteredListings.map((listing) => (
            <div 
              key={listing.id}
              onClick={() => onSelectListing(listing)}
              className="group cursor-pointer dribbble-card"
            >
              <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-white mb-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)]">
                <img 
                  src={listing.image_url || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800'} 
                  alt={listing.title} 
                  className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                <div className="absolute top-6 left-6">
                   <span className="bg-white/90 backdrop-blur-xl text-[9px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full shadow-lg border border-white">
                     {t(listing.category)}
                   </span>
                </div>
              </div>
              <div className="px-1">
                <div className="flex justify-between items-start mb-3 gap-4">
                  <h3 className="text-2xl font-black text-black leading-tight group-hover:text-indigo-600 transition-colors">
                    {listing.title}
                  </h3>
                  <div className="text-right">
                    <span className="text-2xl font-black text-black block leading-none">{listing.price}</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ETB</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center border border-white">
                      <span className="text-[8px] font-black text-black">{listing.seller_name?.[0] || 'S'}</span>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{listing.seller_name || 'Seller'}</p>
                  </div>
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.1em] opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                    View Project →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
