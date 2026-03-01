
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

  const handleContactSeller = () => {
    if (!user) return navigate('/auth');
    if (!listing) return;
    
    localStorage.setItem('savvy_pending_chat', JSON.stringify({ 
      listingId: listing.id, 
      sellerId: listing.seller_id 
    }));
    navigate('/inbox');
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-savvy-bg dark:bg-savvy-dark">
      <div className="w-12 h-12 border-2 border-savvy-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!listing) return (
    <div className="h-screen w-full flex flex-col items-center justify-center dark:text-white px-6 text-center">
      <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter">Listing Archived or Not Found</h2>
      <button onClick={() => navigate('/marketplace')} className="text-savvy-accent uppercase font-black text-xs tracking-widest border-b border-savvy-accent pb-1">Back to Market</button>
    </div>
  );

  return (
    <div className="bg-savvy-bg dark:bg-savvy-dark min-h-screen pb-32 md:pb-0">
      {/* Mobile Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="fixed top-24 left-6 z-50 p-3 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-full shadow-lg lg:hidden"
      >
        <svg className="w-5 h-5 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
      </button>

      <div className="flex flex-col lg:flex-row h-full">
        {/* Left: Product Media (Responsive) */}
        <div className="w-full lg:w-[45%] lg:h-screen lg:fixed lg:left-0 lg:top-0 bg-gray-100 dark:bg-white/5 overflow-hidden">
          <img 
            src={listing.image_url} 
            className="w-full h-full object-cover aspect-square lg:aspect-auto transition-transform duration-[3s] hover:scale-105" 
            alt={listing.title} 
          />
        </div>

        {/* Right: Refined Content */}
        <div className="w-full lg:w-[55%] lg:ml-[45%] px-6 md:px-12 lg:px-20 py-12 md:py-24 lg:py-40 flex flex-col">
          <div className="max-w-xl mx-auto w-full reveal">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-savvy-accent">verified gem</p>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">ID: {listing.id.slice(0,6)}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-[0.95] mb-8 dark:text-white">
              {listing.title}
            </h1>

            <div className="flex items-baseline gap-4 mb-10 border-b dark:border-white/10 pb-10">
              <p className="text-4xl font-black dark:text-white tracking-tighter">{listing.price}</p>
              <span className="text-xs font-black uppercase text-gray-400 tracking-widest">ETB</span>
              <span className="ml-auto text-[9px] font-black text-green-500 uppercase tracking-widest">In Stock</span>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="reveal delay-1">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Category</p>
                <p className="text-sm font-black dark:text-white uppercase tracking-widest">{listing.category.replace('_', ' ')}</p>
              </div>
              <div className="reveal delay-2">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Origin</p>
                <p className="text-sm font-black dark:text-white uppercase tracking-widest">AAU Campus</p>
              </div>
            </div>

            <div className="reveal delay-3 mb-12">
              <h3 className="text-[9px] font-black text-savvy-accent uppercase tracking-[0.4em] mb-4">Narrative</h3>
              <p className="text-lg font-medium leading-relaxed dark:text-gray-300 italic font-serif">
                "{listing.description}"
              </p>
            </div>

            {/* Seller Info Component */}
            <div className="reveal delay-4 p-6 md:p-8 bg-white dark:bg-white/5 rounded-[2.5rem] tibico-border flex items-center justify-between mb-16">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black font-black text-xl">
                   {listing.seller_name?.[0]}
                 </div>
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-widest dark:text-white">{listing.seller_name}</p>
                   <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">AAU Certified Merchant</p>
                 </div>
               </div>
               <button 
                 onClick={handleContactSeller}
                 className="text-[9px] font-black uppercase tracking-widest border-b border-black dark:border-white pb-1 hover:opacity-50 transition-opacity dark:text-white hidden md:block"
               >
                 Inquire
               </button>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex flex-col sm:flex-row gap-4 reveal delay-4">
              <button 
                onClick={() => navigate('/checkout', { state: { listing } })}
                className="btn-premium px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-xl flex-1"
              >
                Acquire Now
              </button>
              <button 
                onClick={handleContactSeller}
                className="px-10 py-5 rounded-full border border-black/10 dark:border-white/10 font-black text-[10px] uppercase tracking-[0.3em] dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
              >
                Message Seller
              </button>
            </div>

            {/* Subtle Back Link for Desktop */}
            <button 
              onClick={() => navigate(-1)}
              className="mt-12 text-[8px] font-black text-gray-400 uppercase tracking-[0.5em] hover:text-savvy-accent transition-colors hidden lg:block"
            >
              ← Return to Gallery
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t dark:border-white/10 p-4 flex gap-3 animate-in slide-in-from-bottom duration-500">
         <button 
            onClick={handleContactSeller}
            className="w-14 h-14 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
         >
           <svg className="w-6 h-6 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
         </button>
         <button 
            onClick={() => navigate('/checkout', { state: { listing } })}
            className="flex-1 btn-premium rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-lg"
         >
           Acquire Now
         </button>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
