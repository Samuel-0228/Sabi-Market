
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../shared/lib/supabase';
import { Listing } from '../../types';
import { useLanguage } from '../../app/LanguageContext';
import { useAuthStore } from '../../features/auth/auth.store';

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
        console.error("Failed to load listing details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-savvy-bg dark:bg-savvy-dark">
      <div className="w-16 h-16 border-2 border-savvy-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!listing) return (
    <div className="h-screen w-full flex flex-col items-center justify-center dark:text-white">
      <h2 className="text-4xl font-black mb-8">ITEM NOT FOUND.</h2>
      <button onClick={() => navigate('/marketplace')} className="text-savvy-accent uppercase font-black tracking-widest border-b-2 border-savvy-accent pb-2">BACK TO MARKET</button>
    </div>
  );

  return (
    <div className="bg-savvy-bg dark:bg-savvy-dark min-h-screen">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Left: Fixed Image Frame */}
        <div className="w-full lg:w-1/2 h-[60vh] lg:h-screen lg:fixed lg:left-0 lg:top-0 bg-gray-100 dark:bg-white/5 overflow-hidden">
          <img 
            src={listing.image_url} 
            className="w-full h-full object-cover transition-transform duration-[5s] hover:scale-110" 
            alt={listing.title} 
          />
        </div>

        {/* Right: Architectural Content */}
        <div className="w-full lg:w-1/2 lg:ml-auto px-10 py-32 lg:py-48 flex flex-col">
          <div className="max-w-2xl mx-auto w-full reveal">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-savvy-accent mb-12">Product ID: {listing.id.slice(0, 8)}</p>
            
            <h1 className="text-7xl md:text-[9rem] font-black tracking-tighter uppercase leading-[0.8] mb-12 dark:text-white">
              {listing.title.split(' ').map((word, i) => (
                <React.Fragment key={i}>{word} <br /></React.Fragment>
              ))}
            </h1>

            <div className="grid grid-cols-2 gap-12 mb-20">
              <div className="reveal delay-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Current Valuation</p>
                <p className="text-5xl font-black dark:text-white tracking-tighter">{listing.price} <span className="text-sm font-bold uppercase text-gray-400">ETB</span></p>
              </div>
              <div className="reveal delay-2">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Origin Campus</p>
                <p className="text-2xl font-black dark:text-white uppercase tracking-widest">AAU - 6 KILO</p>
              </div>
            </div>

            <div className="reveal delay-3 mb-24">
              <h3 className="text-[9px] font-black text-savvy-accent uppercase tracking-[0.4em] mb-8">The Product Narrative</h3>
              <p className="text-2xl font-medium leading-relaxed dark:text-gray-300 italic font-serif max-w-lg">
                "{listing.description}"
              </p>
            </div>

            <div className="reveal delay-4 p-12 bg-white dark:bg-white/5 rounded-[4rem] tibico-border flex items-center justify-between mb-32">
               <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-black font-black text-2xl">
                   {listing.seller_name?.[0]}
                 </div>
                 <div>
                   <p className="text-xs font-black uppercase tracking-widest dark:text-white">{listing.seller_name}</p>
                   <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest">AAU Certified Merchant</p>
                 </div>
               </div>
               <button onClick={() => navigate('/inbox')} className="text-[10px] font-black uppercase tracking-widest border-b border-black dark:border-white pb-2 hover:opacity-50 transition-opacity dark:text-white">INQUIRE</button>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 mb-20 reveal delay-4">
              <button 
                onClick={() => navigate('/checkout', { state: { listing } })}
                className="btn-premium px-16 py-8 rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl flex-1"
              >
                ACQUIRE NOW
              </button>
              <button 
                onClick={() => navigate(-1)}
                className="px-16 py-8 rounded-full border-2 border-black/10 dark:border-white/10 font-black text-[11px] uppercase tracking-[0.4em] dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
              >
                RETURN
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
