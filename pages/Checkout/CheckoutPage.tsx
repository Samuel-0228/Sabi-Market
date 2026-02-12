
import React, { useState } from 'react';
import { Listing } from '../../types/index';
import { db } from '../../services/supabase/db';
import { useLanguage } from '../../app/LanguageContext';
import { useUIStore } from '../../store/ui.store';

interface CheckoutProps {
  listing: Listing;
  onSuccess: () => void;
  onCancel: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ listing, onSuccess, onCancel }) => {
  const { t } = useLanguage();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState('');

  const total = listing.price;

  const handlePlaceOrder = async () => {
    if (!deliveryInfo.trim()) {
      addToast("Please provide meeting details!", "info");
      return;
    }
    
    setLoading(true);
    try {
      await db.createOrder(listing, listing.price, deliveryInfo);
      addToast("Trade request sent! Check 'My Orders'.", "success");
      onSuccess();
    } catch (err: any) {
      console.error("Checkout Failure:", err);
      const errorMsg = err.message || "Trade failed. Please try again.";
      addToast(errorMsg, "error");
      alert(errorMsg);
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
          <h1 className="text-4xl font-black tracking-tighter dark:text-white">Secure Checkout.</h1>
          <p className="text-gray-400 font-medium italic">Buying from {listing.seller_name}</p>
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
            </div>
          </div>

          <div className="p-8 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-500/10">
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">🛡️ Escrow Protection Active</h4>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0"></div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Your funds are held by Savvy until you confirm delivery.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0"></div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Cancel trade anytime before the seller accepts.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Meeting & Delivery Details</label>
            <textarea 
              className="w-full bg-white dark:bg-[#0c0c0e] border border-gray-100 dark:border-white/10 rounded-[2rem] p-8 min-h-[160px] outline-none focus:ring-2 focus:ring-indigo-600 transition-all dark:text-white shadow-sm font-medium"
              placeholder="e.g. Meet at 6 Kilo main gate, tomorrow 4pm."
              value={deliveryInfo}
              onChange={(e) => setDeliveryInfo(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-black dark:bg-white text-white dark:text-black p-12 rounded-[3.5rem] shadow-2xl h-fit">
          <h3 className="text-2xl font-black mb-10 tracking-tight">Summary</h3>
          
          <div className="space-y-6 mb-12">
            <div className="flex justify-between items-center opacity-60">
              <span className="text-sm font-bold">Listing Price</span>
              <span className="font-black">{listing.price} ETB</span>
            </div>
            <div className="flex justify-between items-center text-green-500">
              <span className="text-[9px] font-black uppercase tracking-widest">AAU Fee</span>
              <span className="font-black text-[9px] uppercase tracking-widest">Free (Beta)</span>
            </div>
            <div className="h-[1px] bg-white/10 dark:bg-black/10"></div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-black">Total Cost</span>
              <span className="text-4xl font-black">{total} ETB</span>
            </div>
          </div>

          <button 
            disabled={loading}
            onClick={handlePlaceOrder}
            className="w-full bg-white dark:bg-black text-black dark:text-white py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Confirm Secure Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
