
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../shared/lib/supabase';
import { Listing } from '../../types';
import { useLanguage } from '../../app/LanguageContext';
import { useAuthStore } from '../../features/auth/auth.store';
import { db } from '../../services/supabase/db';

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*, profiles:seller_id(full_name)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setListing({
          ...data,
          seller_name: data.profiles?.full_name || 'Verified Seller'
        });
      } catch (err) {
        console.error("Failed to load listing:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleContactSeller = async () => {
    if (!user) return navigate('/auth');
    if (!listing) return;

    localStorage.setItem('savvy_pending_chat', JSON.stringify({ 
      listingId: listing.id, 
      seller_id: listing.seller_id 
    }));
    navigate('/inbox');
  };

  const handleBuyNow = () => {
    if (!user) return navigate('/auth');
    if (!listing) return;
    navigate('/checkout', { state: { listing } });
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-[3px] border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Inspecting Quality...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-black mb-4">Item not found.</h2>
        <button onClick={() => navigate('/marketplace')} className="text-indigo-600 font-bold underline">Return to Market</button>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Left: Product Image */}
        <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-gray-50 dark:bg-white/5 shadow-2xl group">
          <img 
            src={listing.image_url} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" 
            alt={listing.title} 
          />
        </div>

        {/* Right: Details */}
        <div className="flex flex-col">
          <div className="flex-1">
            <div className="mb-10">
              <span className="bg-indigo-600 text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">
                {t(listing.category)}
              </span>
              <h1 className="text-5xl font-black dark:text-white tracking-tighter mt-6 leading-tight">
                {listing.title}
              </h1>
              <p className="text-4xl font-black text-indigo-600 mt-4">{listing.price} ETB</p>
            </div>

            <div className="space-y-10">
              <div className="p-8 bg-gray-50 dark:bg-white/5 rounded-[2rem] border dark:border-white/5">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Seller Information</h3>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                    {listing.seller_name?.[0]}
                  </div>
                  <div>
                    <p className="text-lg font-black dark:text-white leading-none mb-1">{listing.seller_name}</p>
                    <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Verified AAU Student</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Product Story</h3>
                <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  {listing.description}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 flex gap-6">
            <button 
              onClick={handleContactSeller}
              className="flex-1 py-6 rounded-2xl bg-gray-100 dark:bg-white/5 text-black dark:text-white font-black uppercase text-xs tracking-widest hover:bg-indigo-600 hover:text-white transition-all duration-300"
            >
              {t('chatWithSeller')}
            </button>
            <button 
              onClick={handleBuyNow}
              className="flex-1 py-6 rounded-2xl btn-hope font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
            >
              {t('buyNow')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
