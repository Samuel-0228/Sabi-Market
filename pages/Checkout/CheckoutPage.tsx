
import React, { useState } from 'react';
import { Listing } from '../../types/index';
import { db } from '../../services/supabase/db';
import { useLanguage } from '../../app/LanguageContext';

interface CheckoutProps {
  listing: Listing;
  onSuccess: () => void;
  onCancel: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ listing, onSuccess, onCancel }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState('');

  const total = listing.price;

  const handlePlaceOrder = async () => {
    if (!deliveryInfo.trim()) {
      alert("Please provide meeting details (e.g., Campus, Dormitory No., or specific gate)");
      return;
    }
    
    setLoading(true);
    try {
      await db.createOrder(listing, listing.price, deliveryInfo);
      alert("Trade request successfully sent! You can track the status in 'My Orders'.");
      onSuccess();
    } catch (err: any) {
      alert("Trade failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 animate-in fade-in duration-700">
      <div className="flex items-center gap-6 mb-12">
        <button 
          onClick={onCancel} 
          className="p-4 bg-white dark:bg-white/5 rounded-2xl shadow-sm hover:scale-105 transition-all text-black dark:text-white border border-gray-100 dark:border-white/5"
        >
          ← {t('back')}
        </button>
        <div>
          <h1 className="text-4xl font-black tracking-tighter dark:text-white">Secure Order.</h1>
          <p className="text-gray-400 font-medium">Finalize your trade with {listing.seller_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="bg-white dark:bg-[#0c0c0e] p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 flex gap-6 items-center">
            <div className="w-24 h-32 flex-shrink-0 bg-gray-50 dark:bg-white/5 rounded-2xl overflow-hidden shadow-lg">
              <img src={listing.image_url} className="w-full h-full object-cover" alt={listing.title} />
            </div>
            <div>
              <h3 className="text-2xl font-black dark:text-white leading-tight">{listing.title}</h3>
              <p className="text-indigo-600 font-black text-xl mt-1">{listing.price} ETB</p>
              <div className="mt-2 flex items-center gap-2">
                 <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Escrow Protected</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Meeting & Delivery Details</label>
            <textarea 
              className="w-full bg-white dark:bg-[#0c0c0e] border border-gray-100 dark:border-white/10 rounded-[2rem] p-8 min-h-[160px] outline-none focus:ring-2 focus:ring-indigo-600 transition-all dark:text-white shadow-sm font-medium"
              placeholder="Where and when would you like to meet the seller? (e.g. 6 Kilo Main Gate, tomorrow at 4 PM...)"
              value={deliveryInfo}
              onChange={(e) => setDeliveryInfo(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-black dark:bg-white text-white dark:text-black p-12 rounded-[3.5rem] shadow-2xl h-fit">
          <h3 className="text-2xl font-black mb-10 tracking-tight">Order Summary</h3>
          
          <div className="space-y-6 mb-12">
            <div className="flex justify-between items-center opacity-60">
              <span className="text-sm font-bold">Item Price</span>
              <span className="font-black">{listing.price} ETB</span>
            </div>
            
            <div className="h-[1px] bg-white/10 dark:bg-black/10"></div>
            
            <div className="flex justify-between items-center">
              <span className="text-lg font-black">Total Payable</span>
              <span className="text-4xl font-black">{total} ETB</span>
            </div>
          </div>

          <button 
            disabled={loading}
            onClick={handlePlaceOrder}
            className="w-full bg-white dark:bg-black text-black dark:text-white py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing Trade...' : 'Request Trade'}
          </button>
          
          <div className="mt-8 pt-8 border-t border-white/10 dark:border-black/10">
             <div className="flex gap-4 items-start">
                <div className="text-2xl">🤝</div>
                <p className="text-[10px] text-left opacity-60 uppercase tracking-widest font-bold leading-relaxed">
                  Verified AAU Student Protection Enabled. Your funds are held securely until the trade is completed.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
