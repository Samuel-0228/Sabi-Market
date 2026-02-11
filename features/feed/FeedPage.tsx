
import React, { useEffect, useState, useMemo } from 'react';
import { productApi } from '../../entities/product/product.api';
import { useLanguage } from '../../app/LanguageContext';
import { Listing } from '../../types';

interface FeedPageProps {
  onSelect: (l: Listing) => void;
  onAdd: () => void;
}

const FeedPage: React.FC<FeedPageProps> = ({ onSelect, onAdd }) => {
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const data = await productApi.fetchListings(controller.signal);
        setListings(data);
      } catch (e: any) {
        if (e.name !== 'AbortError') console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    return listings.filter((l: Listing) => {
      const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase());
      const matchesCat = category === 'all' || l.category === category;
      return matchesSearch && matchesCat;
    });
  }, [listings, search, category]);

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-12 animate-in fade-in duration-500">
      <header className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
          <h1 className="text-7xl font-black dark:text-white tracking-tighter mb-4">Explore.</h1>
          <p className="text-gray-400 font-medium italic">Verified campus marketplace.</p>
        </div>
        <div className="flex bg-white dark:bg-white/5 p-2 rounded-2xl border dark:border-white/10">
          <input 
            className="bg-transparent px-6 py-2 outline-none dark:text-white font-bold" 
            placeholder="Search products..." 
            value={search} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} 
          />
        </div>
      </header>

      <div className="flex gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
        {['all', 'goods', 'course', 'academic_materials', 'food'].map((c: string) => (
          <button 
            key={c}
            onClick={() => setCategory(c)}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${category === c ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-400'}`}
          >
            {t(c)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1,2,3,4].map((i: number) => <div key={i} className="aspect-[4/5] bg-gray-50 dark:bg-white/5 rounded-[2.5rem] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {filtered.map((l: Listing) => (
            <div key={l.id} className="group cursor-pointer" onClick={() => onSelect(l)}>
              <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-gray-50 dark:bg-[#0c0c0e] mb-6 shadow-sm group-hover:shadow-2xl transition-all relative">
                <img src={l.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 dark:bg-black/90 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest dark:text-white">{t(l.category)}</span>
                </div>
              </div>
              <h3 className="text-xl font-black dark:text-white group-hover:text-indigo-600 transition-colors">{l.title}</h3>
              <p className="font-bold text-gray-400 mt-1">{l.price} ETB</p>
            </div>
          ))}
        </div>
      )}

      <button onClick={onAdd} className="fixed bottom-10 left-1/2 -translate-x-1/2 btn-hope px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl z-50">
        + Start Selling
      </button>
    </div>
  );
};

export default FeedPage;
